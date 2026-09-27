// ========================================
// ПАРАМЕТРЫ СТЕНДА
// ========================================

export const CONFIG = {

    BASE_URL: 'http://192.168.0.103:8001',

    MAIL_USER: 'test',
    MAIL_PASSWORD: 'test',

    MAILBOX: 'INBOX',

    MAIL_TIMEZONE: 'Asia/Krasnoyarsk',

    FROM_ID: '1',

    STORE_TARGET: 'Sent',


    // ====================================
    // Отправка нового письма
    // ====================================

    MAIL_TO: 'test@example.com',

    MAIL_SUBJECT: 'Test from k6',

    MAIL_MESSAGE: 'Hello from k6',


    // ====================================
    // Ответ на письмо
    // ====================================

    REPLY_SUBJECT_FILTER: 'Test 1',

    REPLY_MESSAGE: 'Reply from k6',


    // ====================================
    // Логи
    // ====================================

    DEBUG: true,


    // ====================================
    // РЕЖИМ ЗАПУСКА
    //
    // single  - по одному прогону
    // profile - профиль 1 час
    // groups  - 2 группы по часу
    // ====================================

    TEST_MODE: 'single',
};


// ========================================
// ОДИНОЧНЫЙ ПРОГОН
// ========================================

export const SINGLE_RUN = {

    vus: 1,

    iterations: 1,
};


// ========================================
// НАГРУЗОЧНЫЙ ПРОФИЛЬ ИЗ ЗАДАНИЯ
// ========================================

export const LOAD_PROFILE = {

    login: {
        rate: 80000,
        preAllocatedVUs: 40,
        maxVUs: 100,
    },

    view: {
        rate: 10000,
        preAllocatedVUs: 10,
        maxVUs: 30,
    },

    reply: {
        rate: 5000,
        preAllocatedVUs: 20,
        maxVUs: 50,
    },

    send: {
        rate: 3000,
        preAllocatedVUs: 10,
        maxVUs: 30,
    },
};


// ========================================
// ПАРАМЕТРЫ НАГРУЗКИ
// ========================================

export const LOAD_SETTINGS = {

    timeUnit: '1h',

    duration: '1h',

    secondGroupStart: '1h',

    gracefulStop: '0s',
};