package com.maroonapron.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private SwipeRefreshLayout swipeRefreshLayout;
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupPullToRefresh();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
                && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}

    private void setupPullToRefresh() {
        webView = bridge.getWebView();

        if (webView == null) {
            return;
        }

        ViewGroup parent = (ViewGroup) webView.getParent();

        if (parent == null) {
            return;
        }

        int index = parent.indexOfChild(webView);
        ViewGroup.LayoutParams layoutParams = webView.getLayoutParams();

        parent.removeView(webView);

        swipeRefreshLayout = new SwipeRefreshLayout(this);
        swipeRefreshLayout.setLayoutParams(layoutParams);

        // Maroon Apron red: #D6293F
        swipeRefreshLayout.setColorSchemeColors(
                Color.rgb(214, 41, 63)
        );

        swipeRefreshLayout.addView(webView);

        // Only allow pull-to-refresh when the WebView is already at the top.
        swipeRefreshLayout.setOnChildScrollUpCallback(
                (parentView, child) -> webView.canScrollVertically(-1)
        );

        parent.addView(swipeRefreshLayout, index);

        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.reload();
            waitForPageLoad();
        });
    }

    private void waitForPageLoad() {
        Handler handler = new Handler(Looper.getMainLooper());

        Runnable checkLoading = new Runnable() {
            @Override
            public void run() {

                if (webView == null || swipeRefreshLayout == null) {
                    return;
                }

                if (webView.getProgress() >= 100) {
                    swipeRefreshLayout.setRefreshing(false);
                } else {
                    handler.postDelayed(this, 100);
                }
            }
        };

        handler.post(checkLoading);
    }
}