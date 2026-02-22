package com.anonymous.WakeTFUpQueIs.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {

        val serviceIntent = Intent(context, AlarmService::class.java)

        context.startForegroundService(serviceIntent)

        val activityIntent =
            context.packageManager.getLaunchIntentForPackage(context.packageName)

        activityIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        context.startActivity(activityIntent)
    }
}