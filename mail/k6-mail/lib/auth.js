import http from 'k6/http';
import { check } from 'k6';

import { CONFIG } from '../config.js';


export function login() {

    // =========================
    // 1. Страница логина
    // =========================

    const loginPage =
        http.get(CONFIG.BASE_URL);

    check(loginPage, {
        'login page status = 200':
            (r) => r.status === 200,
    });


    // =========================
    // 2. Получаем CSRF token
    // =========================

    const loginToken = loginPage
        .html()
        .find('input[name="_token"]')
        .first()
        .attr('value');


    check(loginToken, {
        'login token найден':
            (t) =>
                t !== undefined &&
                t !== '',
    });


    if (!loginToken) {
        throw new Error(
            'Не найден login token'
        );
    }


    // =========================
    // 3. Авторизация
    // =========================

    const loginPayload = {

        _token: loginToken,

        _task: 'login',

        _action: 'login',

        _timezone:
            CONFIG.MAIL_TIMEZONE,

        _url: '',

        _user:
            CONFIG.MAIL_USER,

        _pass:
            CONFIG.MAIL_PASSWORD,
    };


    const loginResponse = http.post(
        `${CONFIG.BASE_URL}/?_task=login`,
        loginPayload,
        {
            redirects: 0,
        }
    );


    check(loginResponse, {

        'login status = 302':
            (r) =>
                r.status === 302,

        'redirect ведёт в mail':
            (r) =>
                r.headers.Location !== undefined &&
                r.headers.Location.includes(
                    '_task=mail'
                ),
    });


    const location =
        loginResponse.headers.Location;


    if (!location) {
        throw new Error(
            'После логина отсутствует Location'
        );
    }


    // =========================
    // 4. Inbox
    // =========================

    const inboxUrl =
        `${CONFIG.BASE_URL}${location}`;


    const inboxResponse =
        http.get(inboxUrl);


    check(inboxResponse, {
        'inbox status = 200':
            (r) =>
                r.status === 200,
    });


    // =========================
    // 5. AJAX request_token
    // =========================

    const tokenMatch =
        inboxResponse.body.match(
            /"request_token":"([^"]+)"/
        );


    const requestToken =
        tokenMatch
            ? tokenMatch[1]
            : null;


    check(requestToken, {
        'request token найден':
            (t) =>
                t !== null &&
                t !== '',
    });


    if (!requestToken) {
        throw new Error(
            'Не найден request_token'
        );
    }


    if (CONFIG.DEBUG) {

        console.log(
            `LOGIN OK | USER = ${CONFIG.MAIL_USER}`
        );
    }


    return {

        inboxUrl,

        requestToken,
    };
}