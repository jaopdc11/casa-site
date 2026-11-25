package dev.jaopd.casa;

import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebBackForwardList;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import java.util.Collections;

/**
 * Casco fino: abre o site ao vivo (casa.jaopd.dev) no WebView. Deploy do front aparece no app sem
 * build novo; build novo só quando muda o nativo. Login, sessão e offline são do site (cookie da
 * API + service worker). O nativo cuida de: trava por digital, barras do sistema e botão voltar.
 * Push ainda não existe (a API da Casa não tem endpoint de push).
 */
public class MainActivity extends BridgeActivity {

    private Trava trava;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NavegacaoPlugin.class); // antes do super.onCreate, que monta a bridge
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();

        // A API é de outra origem; o cookie de sessão precisa ser aceito.
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        silenciarEventosNoSite(webView);
        aplicarMargensDasBarras();
        voltarPeloHistorico();

        trava = new Trava(this, () -> { });
        trava.aoCriar();

        if (savedInstanceState == null) webView.loadUrl(Site.URL + "/");
    }

    @Override
    public void onStart() {
        super.onStart();
        trava.aoIniciar();
    }

    @Override
    public void onStop() {
        trava.aoParar();
        super.onStop();
    }

    /**
     * O Capacitor avisa pausa/retomada rodando `window.Capacitor.triggerEvent(...)` na página
     * aberta. O site não tem a ponte, e isso vira erro no console a cada troca de app; um objeto
     * mínimo absorve a chamada.
     */
    private void silenciarEventosNoSite(WebView webView) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return;
        WebViewCompat.addDocumentStartJavaScript(webView,
            "if(!window.Capacitor){Object.defineProperty(window,'Capacitor',{value:{" +
            "triggerEvent:function(){},isNativePlatform:function(){return false;}}});}",
            Collections.singleton(Site.URL));
    }

    /**
     * Voltar percorre o histórico do WebView, como no navegador. A primeira entrada é a página
     * local de entrada do Capacitor; chegando nela, o app fecha em vez de mostrar a tela vazia.
     */
    private void voltarPeloHistorico() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                WebBackForwardList hist = webView.copyBackForwardList();
                int i = hist.getCurrentIndex();
                boolean anteriorEhDoSite = i > 0 && hist.getItemAtIndex(i - 1).getUrl().startsWith(Site.URL);
                if (anteriorEhDoSite) {
                    webView.goBack();
                    return;
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }

    /**
     * Com targetSdk 35+ o Android força edge-to-edge; o site não reserva a área das barras, então
     * as margens vão no container do WebView. O teclado não entra no padding (o WebView trata).
     */
    private void aplicarMargensDasBarras() {
        View container = (View) getBridge().getWebView().getParent();
        container.setBackgroundColor(ContextCompat.getColor(this, R.color.fundo));
        WindowCompat.getInsetsController(getWindow(), container).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), container).setAppearanceLightNavigationBars(false);
        int barrasECorte = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
        ViewCompat.setOnApplyWindowInsetsListener(container, (v, insets) -> {
            Insets barras = insets.getInsets(barrasECorte);
            // Edge-to-edge (targetSdk 35+) não redimensiona sozinho com o teclado: o teclado entra
            // como padding de baixo, aí o WebView encolhe e o botão do login fica visível.
            Insets teclado = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(barras.left, barras.top, barras.right, Math.max(barras.bottom, teclado.bottom));
            return new WindowInsetsCompat.Builder(insets).setInsets(barrasECorte, Insets.NONE).build();
        });
        ViewCompat.requestApplyInsets(container);
    }
}
