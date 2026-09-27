import { CONFIG } from './config.js';

import {
    SINGLE_RUN,
    LOAD_PROFILE,
    LOAD_SETTINGS,
} from './config.js';

import {
    login,
} from './lib/auth.js';

import {
    viewNewMessages,
} from './01-login-http.js';

import {
    sendMail,
} from './02-send-http.js';

import {
    replyMail,
} from './03-reply-http.js';


// ========================================
// Одиночный функциональный прогон
// ========================================

export function singleRunScenario() {

    // Один логин
    const session =
        login();


    // Сначала отвечаем на NEW Test 1
    // иначе просмотр сделает их прочитанными
    replyMail(
        session
    );


    // Просматриваем остальные NEW
    viewNewMessages(
        session
    );


    // Отправляем одно новое письмо
    sendMail();
}


// ========================================
// Бизнес-операции для профиля
// ========================================

export function loginScenario() {

    login();
}


// Сессия хранится внутри VU
let viewSession = null;

export function viewScenario() {

    if (viewSession === null) {

        viewSession =
            login();
    }


    viewNewMessages(
        viewSession
    );
}


// Сессия отправки
let sendLoggedIn = false;

export function sendScenario() {

    if (!sendLoggedIn) {

        login();

        sendLoggedIn = true;
    }


    sendMail();
}


// Сессия Reply
let replySession = null;

export function replyScenario() {

    if (replySession === null) {

        replySession =
            login();
    }


    replyMail(
        replySession
    );
}


// ========================================
// Constant Arrival Rate
// ========================================

function arrivalRate(
    exec,
    profile,
    startTime = '0s'
) {

    return {

        executor:
            'constant-arrival-rate',

        exec,

        rate:
            profile.rate,

        timeUnit:
            LOAD_SETTINGS.timeUnit,

        duration:
            LOAD_SETTINGS.duration,

        startTime,

        preAllocatedVUs:
            profile.preAllocatedVUs,

        maxVUs:
            profile.maxVUs,

        gracefulStop:
            LOAD_SETTINGS.gracefulStop,
    };
}


// ========================================
// SINGLE
//
// Сейчас активен именно этот режим.
// 1 VU × 1 iteration.
// ========================================

const singleOptions = {

    scenarios: {

        single: {

            executor:
                'shared-iterations',

            exec:
                'singleRunScenario',

            vus:
                SINGLE_RUN.vus,

            iterations:
                SINGLE_RUN.iterations,
        },
    },
};


// ========================================
// PROFILE — 1 час
// ========================================

const profileOptions = {

    scenarios: {

        login: arrivalRate(
            'loginScenario',
            LOAD_PROFILE.login
        ),

        view: arrivalRate(
            'viewScenario',
            LOAD_PROFILE.view
        ),

        reply: arrivalRate(
            'replyScenario',
            LOAD_PROFILE.reply
        ),

        send: arrivalRate(
            'sendScenario',
            LOAD_PROFILE.send
        ),
    },
};


// ========================================
// GROUPS
//
// Первая группа: 0-1 час
// Вторая:        1-2 час
// ========================================

const groupsOptions = {

    scenarios: {

        // GROUP 1

        group1_login: arrivalRate(
            'loginScenario',
            LOAD_PROFILE.login,
            '0s'
        ),

        group1_view: arrivalRate(
            'viewScenario',
            LOAD_PROFILE.view,
            '0s'
        ),

        group1_reply: arrivalRate(
            'replyScenario',
            LOAD_PROFILE.reply,
            '0s'
        ),

        group1_send: arrivalRate(
            'sendScenario',
            LOAD_PROFILE.send,
            '0s'
        ),


        // GROUP 2

        group2_login: arrivalRate(
            'loginScenario',
            LOAD_PROFILE.login,
            LOAD_SETTINGS.secondGroupStart
        ),

        group2_view: arrivalRate(
            'viewScenario',
            LOAD_PROFILE.view,
            LOAD_SETTINGS.secondGroupStart
        ),

        group2_reply: arrivalRate(
            'replyScenario',
            LOAD_PROFILE.reply,
            LOAD_SETTINGS.secondGroupStart
        ),

        group2_send: arrivalRate(
            'sendScenario',
            LOAD_PROFILE.send,
            LOAD_SETTINGS.secondGroupStart
        ),
    },
};


// ========================================
// Выбор режима из config.js
// ========================================

export const options =

    CONFIG.TEST_MODE === 'profile'
        ? profileOptions

        : CONFIG.TEST_MODE === 'groups'
        ? groupsOptions

        : singleOptions;