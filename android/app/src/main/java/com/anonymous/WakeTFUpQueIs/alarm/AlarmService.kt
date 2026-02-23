package com.anonymous.WakeTFUpQueIs.alarm

import android.app.*
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.anonymous.WakeTFUpQueIs.MainActivity
import com.anonymous.WakeTFUpQueIs.R
import android.app.PendingIntent
import com.anonymous.WakeTFUpQueIs.alarm.AlarmRingingActivity

class AlarmService : Service() {

  private var player: MediaPlayer? = null

  override fun onCreate() {
    super.onCreate()

    try {
      createChannel()

      // Tap notification -> open app
      val contentIntent = PendingIntent.getActivity(
        this,
        100,
        Intent(this, MainActivity::class.java).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      // Full-screen intent (alarm popup)
      val fullScreenIntent = PendingIntent.getActivity(
        this,
        101,
        Intent(this, AlarmRingingActivity::class.java).apply {
          addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_SINGLE_TOP
          )
        },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val notification = NotificationCompat.Builder(this, "alarm_channel")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle("QR Alarm Ringing")
        .setContentText("Scan QR to stop")
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .setOngoing(true)
        .setAutoCancel(false)
        .setContentIntent(contentIntent)
        .setFullScreenIntent(fullScreenIntent, true) // ✅ THIS is the popup part
        .build()

      startForeground(1, notification)

      player = MediaPlayer.create(this, R.raw.alarm)
      if (player == null) {
        Log.e("AlarmService", "MediaPlayer.create returned null (R.raw.alarm missing?)")
        return
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        player?.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
      }

      player?.isLooping = true
      player?.start()

    } catch (e: Exception) {
      Log.e("AlarmService", "Crash in AlarmService.onCreate", e)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    return START_STICKY
  }

  override fun onDestroy() {
    try {
      player?.stop()
      player?.release()
    } catch (e: Exception) {
      Log.e("AlarmService", "Error stopping player", e)
    }
    player = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(NotificationManager::class.java)

      val channel = NotificationChannel(
        "alarm_channel",
        "Alarm Channel",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }

      manager.createNotificationChannel(channel)
    }
  }
}