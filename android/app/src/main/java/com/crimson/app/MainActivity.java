package com.maroonapron.app;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private SwipeRefreshLayout swipeRefreshLayout;
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupPullToRefresh();
    }

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