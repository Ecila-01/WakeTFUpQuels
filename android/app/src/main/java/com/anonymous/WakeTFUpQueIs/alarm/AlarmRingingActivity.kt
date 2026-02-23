package com.anonymous.WakeTFUpQueIs.alarm

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity

class AlarmRingingActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )
  }

  override fun getMainComponentName(): String = "main"
}