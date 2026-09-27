import http from 'k6/http';
import { check } from 'k6';

import { CONFIG } from './config.js';
import { login } from './lib/auth.js';


export const options = {
    vus: 1,
    iterations: 1,
};


// ========================================
// Отправка нового письма
// ========================================

export function sendMail() {

    // =========================
    // 1. Compose
    // =========================

    const composeResponse =
        http.get(

            `${CONFIG.BASE_URL}` +
            `/?_task=mail` +
            `&_action=compose`
        );


    check(composeResponse, {

        'compose status = 200':
            (r) =>
                r.status === 200,
    });


    const composeHtml =
        composeResponse.html();


    // =========================
    // 2. Динамические параметры
    // =========================

    const composeToken =
        composeHtml

            .find(
                'input[name="_token"]'
            )

            .first()

            .attr('value');


    const composeId =
        composeHtml

            .find(
                'input[name="_id"]'
            )

            .first()

            .attr('value');


    check(composeToken, {

        'compose token найден':
            (t) =>
                t !== undefined &&
                t !== '',
    });


    check(composeId, {

        'compose id найден':
            (t) =>
                t !== undefined &&
                t !== '',
    });


    // =========================
    // 3. Письмо
    // =========================

    const payload = {

        _token:
            composeToken,

        _task:
            'mail',

        _action:
            'send',

        _id:
            composeId,

        _attachments:
            '',

        _from:
            CONFIG.FROM_ID,

        _to:
            CONFIG.MAIL_TO,

        _cc:
            '',

        _bcc:
            '',

        _replyto:
            '',

        _followupto:
            '',

        _subject:
            CONFIG.MAIL_SUBJECT,

        _draft_saveid:
            '',

        _draft:
            '',

        _is_html:
            '0',

        _framed:
            '1',

        _message:
            CONFIG.MAIL_MESSAGE,

        editorSelector:
            'plain',

        _mdn:
            '',

        _dsn:
            '',

        _keepformatting:
            '',

        _priority:
            '0',

        _store_target:
            CONFIG.STORE_TARGET,
    };


    // =========================
    // 4. POST отправки
    // =========================

    const now =
        Date.now();


    const response = http.post(

        `${CONFIG.BASE_URL}/?_task=mail` +

        `&_unlock=loading${now}` +

        `&_framed=1` +

        `&_lang=en`,

        payload
    );


    check(response, {

        'send status = 200':
            (r) =>
                r.status === 200,
    });


    if (CONFIG.DEBUG) {

        console.log(
            `MAIL TO = ${CONFIG.MAIL_TO}`
        );

        console.log(
            `SUBJECT = ${CONFIG.MAIL_SUBJECT}`
        );

        console.log(
            `MESSAGE = ${CONFIG.MAIL_MESSAGE}`
        );
    }
}


// ========================================
// Самостоятельный запуск
// ========================================

export default function () {

    login();

    sendMail();
}