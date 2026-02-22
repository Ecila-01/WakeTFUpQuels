package com.anonymous.WakeTFUpQueIs.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.anonymous.WakeTFUpQueIs.R

class AlarmService : Service() {

    private var player: MediaPlayer? = null

    override fun onCreate() {
        super.onCreate()

        try {
            createChannel()

            val notification: Notification =
                NotificationCompat.Builder(this, "alarm_channel")
                    .setContentTitle("QR Alarm Ringing")
                    .setContentText("Scan QR to stop")
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setOngoing(true)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .build()

            // Start foreground immediately
            startForeground(1, notification)

            // Start looping alarm sound
            player = MediaPlayer.create(this, R.raw.alarm)

            if (player == null) {
                Log.e("AlarmService", "MediaPlayer.create returned null (R.raw.alarm not found?)")
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
            )
            manager.createNotificationChannel(channel)
        }
    }
}