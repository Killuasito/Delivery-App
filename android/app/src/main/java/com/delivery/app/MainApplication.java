package com.delivery.app;

import android.app.Application;
import android.util.Log;
import com.google.firebase.FirebaseApp;

public class MainApplication extends Application {
    private static final String TAG = "MainApplication";

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
                Log.d(TAG, "Firebase initialized manually.");
            } else {
                Log.d(TAG, "Firebase already initialized.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Firebase initialization error (non-fatal)", e);
        }
    }
}
