package com.anonymous.WakeTFUpQueIs.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AlarmModule"
    }

    /**
     * Opens the system screen to allow "Exact alarms" if not allowed yet.
     * Safe for Android 12+ (S).
     */
    @ReactMethod
    fun requestExactAlarmPermission() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return

        val alarmManager =
            reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        if (alarmManager.canScheduleExactAlarms()) return

        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
            data = Uri.parse("package:${reactContext.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        // If there is an Activity, use it. Otherwise launch from application context.
        val activity = reactContext.currentActivity
        if (activity != null) {
            activity.startActivity(intent)
        } else {
            reactContext.startActivity(intent)
        }
    }

    /**
     * Schedule alarm at specific time (ms since epoch).
     * If exact alarms are not allowed, it will open the settings screen and return.
     */
    @ReactMethod
    fun scheduleAlarm(timeMillis: Double) {

        val alarmManager =
            reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Android 12+ requires exact alarm permission enabled
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                requestExactAlarmPermission()
                return
            }
        }

        val intent = Intent(reactContext, AlarmReceiver::class.java)

        val pendingIntent =
            PendingIntent.getBroadcast(
                reactContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            timeMillis.toLong(),
            pendingIntent
        )
    }

    /**
     * Stop alarm sound service.
     */
    @ReactMethod
    fun stopAlarm() {
        reactContext.stopService(
            Intent(reactContext, AlarmService::class.java)
        )
    }
}