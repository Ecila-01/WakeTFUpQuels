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

  override fun getName(): String = "AlarmModule"

  /**
   * Opens the system screen to allow "Exact alarms" if not allowed yet.
   * (Not required if you switch to setAlarmClock, but safe to keep.)
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

    // Launch from application context (no Activity needed)
    reactContext.startActivity(intent)
  }

  /**
   * Schedule alarm at specific time (ms since epoch).
   * Uses setAlarmClock for better reliability on real devices.
   */
  @ReactMethod
  fun scheduleAlarm(timeMillis: Double) {

    val alarmManager =
      reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    val intent = Intent(reactContext, AlarmReceiver::class.java)

    val pendingIntent = PendingIntent.getBroadcast(
      reactContext,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val triggerAt = timeMillis.toLong()

    // PendingIntent shown by system if user taps the "next alarm" UI
    val launchIntent =
      reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)

    val showPendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        reactContext,
        1,
        it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    if (showPendingIntent != null) {
      val info = AlarmManager.AlarmClockInfo(triggerAt, showPendingIntent)
      alarmManager.setAlarmClock(info, pendingIntent)
    } else {
      // fallback
      alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
    }
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