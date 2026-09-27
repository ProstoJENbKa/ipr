import http from 'k6/http';
import { check } from 'k6';

import { CONFIG } from './config.js';
import { login } from './lib/auth.js';


export const options = {
    vus: 1,
    iterations: 1,
};


// ========================================
// Получение одной страницы писем
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

        [`mail list page ${page} status = 200`]:
            (r) =>
                r.status === 200,

        [`mail list page ${page} JSON`]:
            (r) =>
                r.headers['Content-Type'] !== undefined &&
                r.headers['Content-Type']
                    .includes('application/json'),
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
// Просмотр всех новых писем
// ========================================

export function viewNewMessages(session) {

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


    // Если писем больше 50,
    // проходим остальные страницы

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


    let viewedCount = 0;


    for (const message of messages) {

        if (CONFIG.DEBUG) {

            console.log(

                `UID = ${message.uid}` +

                ` | SUBJECT = ${message.subject}` +

                ` | UNREAD = ${message.isUnread}`
            );
        }


        if (!message.isUnread) {
            continue;
        }


        const previewResponse =
            http.get(

                `${CONFIG.BASE_URL}/?_task=mail` +

                `&_uid=${message.uid}` +

                `&_mbox=${CONFIG.MAILBOX}` +

                `&_framed=1` +

                `&_action=preview`
            );


        check(previewResponse, {

            [`письмо UID ${message.uid} открыто`]:
                (r) =>
                    r.status === 200,
        });


        viewedCount++;


        if (CONFIG.DEBUG) {

            console.log(

                `ОТКРЫТО ПИСЬМО` +

                ` | UID = ${message.uid}` +

                ` | SUBJECT = ${message.subject}`
            );
        }
    }


    if (CONFIG.DEBUG) {

        console.log(
            `ПРОСМОТРЕНО НОВЫХ ПИСЕМ = ${viewedCount}`
        );
    }


    return viewedCount;
}


// ========================================
// Самостоятельный запуск файла
// ========================================

export default function () {

    const session =
        login();


    viewNewMessages(
        session
    );
}