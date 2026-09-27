import http from 'k6/http';
import { check } from 'k6';

import { CONFIG } from './config.js';
import { login } from './lib/auth.js';


export const options = {
    vus: 1,
    iterations: 1,
};


// ========================================
// Получение страницы писем
// ========================================

function getMessagePage(session, page) {

    const now =
        Date.now();


    const response = http.get(

        `${CONFIG.BASE_URL}/?_task=mail` +

        `&_action=list` +

        `&_refresh=1` +

        `&_layout=widescreen` +

        `&_mbox=${CONFIG.MAILBOX}` +

        `&_page=${page}` +

        `&_unlock=loading${now}` +

        `&_=${now}`,

        {
            headers: {

                'Accept':
                    'application/json, text/javascript, */*; q=0.01',

                'X-Roundcube-Request':
                    session.requestToken,

                'X-Requested-With':
                    'XMLHttpRequest',

                'Referer':
                    session.inboxUrl,
            },
        }
    );


    check(response, {

        [`reply list page ${page} = 200`]:
            (r) =>
                r.status === 200,
    });


    const json =
        response.json();


    const execText =
        json.exec || '';


    const regex =
        /this\.add_message_row\((\d+),(\{.*?\}),(\{.*?\}),(?:true|false)\);/g;


    const messages = [];

    let match;


    while (
        (match = regex.exec(execText)) !== null
    ) {

        const data =
            JSON.parse(match[2]);

        const flags =
            JSON.parse(match[3]);


        messages.push({

            uid:
                match[1],

            subject:
                data.subject || '',

            isUnread:
                flags.seen !== 1,
        });
    }


    const pageCount =
        json.env &&
        json.env.pagecount
            ? Number(json.env.pagecount)
            : 1;


    return {

        messages,

        pageCount,
    };
}


// ========================================
// Ответ на новые Test 1
// ========================================

export function replyMail(session) {

    let messages = [];


    const firstPage =
        getMessagePage(
            session,
            1
        );


    messages =
        messages.concat(
            firstPage.messages
        );


    for (
        let page = 2;
        page <= firstPage.pageCount;
        page++
    ) {

        const nextPage =
            getMessagePage(
                session,
                page
            );


        messages =
            messages.concat(
                nextPage.messages
            );
    }


    let replyCount = 0;


    for (const message of messages) {

        if (CONFIG.DEBUG) {

            console.log(

                `UID = ${message.uid}` +

                ` | SUBJECT = ${message.subject}` +

                ` | UNREAD = ${message.isUnread}`
            );
        }


        // =========================
        // Условие ответа
        // =========================

        const needReply =

            message.isUnread &&

            message.subject.includes(
                CONFIG.REPLY_SUBJECT_FILTER
            ) &&

            // Не отвечаем на собственные Re:
            !/^Re:/i.test(
                message.subject
            );


        if (!needReply) {
            continue;
        }


        // =========================
        // 1. Compose ответа
        // =========================

        const composeResponse =
            http.get(

                `${CONFIG.BASE_URL}/?_task=mail` +

                `&_reply_uid=${message.uid}` +

                `&_mbox=${CONFIG.MAILBOX}` +

                `&_action=compose`
            );


        check(composeResponse, {

            [`reply compose UID ${message.uid} = 200`]:
                (r) =>
                    r.status === 200,
        });


        const html =
            composeResponse.html();


        // =========================
        // 2. Данные формы
        // =========================

        const token =
            html
                .find(
                    'input[name="_token"]'
                )
                .first()
                .attr('value');


        const composeId =
            html
                .find(
                    'input[name="_id"]'
                )
                .first()
                .attr('value');


        const replyTo =
            html
                .find(
                    'textarea[name="_to"]'
                )
                .first()
                .text();


        const replySubject =
            html
                .find(
                    'input[name="_subject"]'
                )
                .first()
                .attr('value');


        const quotedMessage =
            html
                .find(
                    'textarea[name="_message"]'
                )
                .first()
                .text();


        check(token, {

            [`reply token UID ${message.uid}`]:
                (t) =>
                    t !== undefined &&
                    t !== '',
        });


        check(composeId, {

            [`reply id UID ${message.uid}`]:
                (t) =>
                    t !== undefined &&
                    t !== '',
        });


        // =========================
        // 3. Текст ответа
        // =========================

        const fullMessage =

            `${CONFIG.REPLY_MESSAGE}` +

            `\n\n` +

            `${quotedMessage}`;


        // =========================
        // 4. Payload ответа
        // =========================

        const payload = {

            _token:
                token,

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
                replyTo,

            _cc:
                '',

            _bcc:
                '',

            _replyto:
                '',

            _followupto:
                '',

            _subject:
                replySubject,

            _draft_saveid:
                '',

            _draft:
                '',

            _is_html:
                '0',

            _framed:
                '1',

            _message:
                fullMessage,

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
        // 5. Отправка ответа
        // =========================

        const now =
            Date.now();


        const sendResponse =
            http.post(

                `${CONFIG.BASE_URL}/?_task=mail` +

                `&_unlock=loading${now}` +

                `&_framed=1` +

                `&_lang=en`,

                payload
            );


        check(sendResponse, {

            [`ответ UID ${message.uid} отправлен`]:
                (r) =>
                    r.status === 200,
        });


        replyCount++;


        if (CONFIG.DEBUG) {

            console.log(

                `ОТВЕТ ОТПРАВЛЕН` +

                ` | UID = ${message.uid}` +

                ` | SUBJECT = ${replySubject}`
            );
        }
    }


    if (CONFIG.DEBUG) {

        console.log(
            `ВСЕГО ОТПРАВЛЕНО ОТВЕТОВ = ${replyCount}`
        );
    }


    return replyCount;
}


// ========================================
// Самостоятельный запуск
// ========================================

export default function () {

    const session =
        login();


    replyMail(
        session
    );
}