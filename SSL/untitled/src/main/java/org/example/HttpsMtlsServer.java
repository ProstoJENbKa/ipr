package org.example;

import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsExchange;
import com.sun.net.httpserver.HttpsParameters;
import com.sun.net.httpserver.HttpsServer;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.TrustManagerFactory;
import java.io.FileInputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

public class HttpsMtlsServer {

    public static void main(String[] args) throws Exception {

        String keyStorePassword = "123456";
        String trustStorePassword = "123456";

        // server.jks = приватный ключ + сертификат нашего HTTPS-сервера
        KeyStore keyStore = KeyStore.getInstance("JKS");

        try (FileInputStream input = new FileInputStream("server.jks")) {
            keyStore.load(input, keyStorePassword.toCharArray());
        }

        KeyManagerFactory keyManagerFactory =
                KeyManagerFactory.getInstance(
                        KeyManagerFactory.getDefaultAlgorithm()
                );

        keyManagerFactory.init(
                keyStore,
                keyStorePassword.toCharArray()
        );

        // server-truststore.jks = CA, которому сервер доверяет
        KeyStore trustStore = KeyStore.getInstance("PKCS12");

        try (FileInputStream input =
                     new FileInputStream("server-truststore.jks")) {

            trustStore.load(
                    input,
                    trustStorePassword.toCharArray()
            );
        }

        TrustManagerFactory trustManagerFactory =
                TrustManagerFactory.getInstance(
                        TrustManagerFactory.getDefaultAlgorithm()
                );

        trustManagerFactory.init(trustStore);

        // Создаем TLS-контекст
        SSLContext sslContext = SSLContext.getInstance("TLS");

        sslContext.init(
                keyManagerFactory.getKeyManagers(),
                trustManagerFactory.getTrustManagers(),
                null
        );

        // HTTPS-сервер слушает порт 8443
        HttpsServer server =
                HttpsServer.create(new InetSocketAddress(8443), 0);

        server.setHttpsConfigurator(
                new HttpsConfigurator(sslContext) {

                    @Override
                    public void configure(HttpsParameters params) {

                        SSLParameters sslParameters =
                                getSSLContext()
                                        .getDefaultSSLParameters();

                        // Требуем сертификат от клиента
                        sslParameters.setNeedClientAuth(true);

                        params.setSSLParameters(sslParameters);
                    }
                }
        );

        // GET /
        server.createContext("/", exchange -> {

            HttpsExchange httpsExchange =
                    (HttpsExchange) exchange;

            String client =
                    httpsExchange
                            .getSSLSession()
                            .getPeerPrincipal()
                            .getName();

            String response =
                    "Hello from HTTPS server!\n" +
                            "Client certificate: " +
                            client +
                            "\n";

            byte[] bytes =
                    response.getBytes(StandardCharsets.UTF_8);

            exchange.sendResponseHeaders(
                    200,
                    bytes.length
            );

            exchange
                    .getResponseBody()
                    .write(bytes);

            exchange.close();
        });

        server.start();

        System.out.println(
                "HTTPS mTLS server started on port 8443"
        );
    }
}