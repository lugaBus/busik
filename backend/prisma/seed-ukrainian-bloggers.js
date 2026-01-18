"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();

async function main() {
    console.log('🌱 Seeding Ukrainian bloggers...');
    
    // Get admin user
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin42@lugabus.com' },
    });
    
    if (!adminUser) {
        console.error('❌ Admin user not found. Please run seed-simple.js first.');
        process.exit(1);
    }

    // Get categories
    const categories = await prisma.category.findMany();
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.slug] = cat;
    });

    // Get ratios
    const ratios = await prisma.ratio.findMany();
    const ratioMap = {};
    ratios.forEach(r => {
        ratioMap[r.slug] = r;
    });

    // Get platforms
    const platforms = await prisma.platform.findMany();
    const platformMap = {};
    platforms.forEach(p => {
        platformMap[p.slug] = p;
    });

    // Create platforms if they don't exist
    const platformData = [
        { name: { en: 'YouTube', ua: 'YouTube', ru: 'YouTube' }, slug: 'youtube' },
        { name: { en: 'Instagram', ua: 'Instagram', ru: 'Instagram' }, slug: 'instagram' },
        { name: { en: 'TikTok', ua: 'TikTok', ru: 'TikTok' }, slug: 'tiktok' },
        { name: { en: 'Telegram', ua: 'Telegram', ru: 'Telegram' }, slug: 'telegram' },
        { name: { en: 'Twitter', ua: 'Twitter', ru: 'Twitter' }, slug: 'twitter' },
    ];

    for (const platform of platformData) {
        if (!platformMap[platform.slug]) {
            const created = await prisma.platform.create({ data: platform });
            platformMap[platform.slug] = created;
            console.log(`✅ Created platform: ${platform.slug}`);
        }
    }

    // Ukrainian bloggers with their positions on mobilization and closed borders
    // Format: { name, quote, description, mainLink, platforms, categories, ratio, tone, rating, piterTest, mobilizationPosition, bordersPosition }
    // tone: -10 to +10 (positive = supports mobilization/closed borders, negative = against)
    // ratio: 'patriot' (supports), 'neutral', 'traitor' (against)
    const bloggers = [
        {
            name: { en: 'Serhiy Prytula', ua: 'Сергій Притула', ru: 'Сергей Притула' },
            quote: { en: 'Every Ukrainian must defend their homeland', ua: 'Кожен українець повинен захищати свою батьківщину', ru: 'Каждый украинец должен защищать свою родину' },
            description: { en: 'TV presenter, volunteer, actively supports mobilization and closed borders', ua: 'Телеведучий, волонтер, активно підтримує мобілізацію та закриті кордони', ru: 'Телеведущий, волонтер, активно поддерживает мобилизацию и закрытые границы' },
            mainLink: 'https://www.instagram.com/prytulafoundation',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/prytulafoundation' },
                { slug: 'telegram', url: 'https://t.me/prytulafoundation' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 8,
            rating: 9,
            piterTest: 'True',
            mobilizationPosition: 'strong_support',
            bordersPosition: 'closed',
        },
        {
            name: { en: 'Iryna Farion', ua: 'Ірина Фаріон', ru: 'Ирина Фарион' },
            quote: { en: 'Ukraine needs mobilization to win', ua: 'Україні потрібна мобілізація для перемоги', ru: 'Украине нужна мобилизация для победы' },
            description: { en: 'Linguist, public figure, supports mobilization and closed borders', ua: 'Лінгвіст, громадський діяч, підтримує мобілізацію та закриті кордони', ru: 'Лингвист, общественный деятель, поддерживает мобилизацию и закрытые границы' },
            mainLink: 'https://www.instagram.com/irynafarion',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/irynafarion' },
                { slug: 'telegram', url: 'https://t.me/irynafarion' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 9,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'strong_support',
            bordersPosition: 'closed',
        },
        {
            name: { en: 'Oleksandr Usyk', ua: 'Олександр Усик', ru: 'Александр Усик' },
            quote: { en: 'I fight for Ukraine', ua: 'Я б\'юся за Україну', ru: 'Я сражаюсь за Украину' },
            description: { en: 'Boxing champion, supports mobilization, returned to Ukraine', ua: 'Чемпіон з боксу, підтримує мобілізацію, повернувся в Україну', ru: 'Чемпион по боксу, поддерживает мобилизацию, вернулся в Украину' },
            mainLink: 'https://www.instagram.com/usykaa',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/usykaa' },
            ],
            categories: ['sports'],
            ratio: 'patriot',
            tone: 7,
            rating: 10,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'closed',
        },
        {
            name: { en: 'Vitaliy Klitschko', ua: 'Віталій Кличко', ru: 'Виталий Кличко' },
            quote: { en: 'Kyiv stands strong', ua: 'Київ стоїть міцно', ru: 'Киев стоит крепко' },
            description: { en: 'Mayor of Kyiv, supports mobilization and closed borders', ua: 'Мер Києва, підтримує мобілізацію та закриті кордони', ru: 'Мэр Киева, поддерживает мобилизацию и закрытые границы' },
            mainLink: 'https://www.instagram.com/vitali_klitschko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/vitali_klitschko' },
                { slug: 'telegram', url: 'https://t.me/vitali_klitschko' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 6,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'closed',
        },
        {
            name: { en: 'Andriy Khlyvnyuk', ua: 'Андрій Хливнюк', ru: 'Андрей Хлывнюк' },
            quote: { en: 'Music is a weapon', ua: 'Музика - це зброя', ru: 'Музыка - это оружие' },
            description: { en: 'Musician, frontman of Boombox, supports mobilization', ua: 'Музикант, фронтмен Boombox, підтримує мобілізацію', ru: 'Музыкант, фронтмен Boombox, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/khlyvnyuk',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/khlyvnyuk' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 7,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Jamala', ua: 'Джамала', ru: 'Джамала' },
            quote: { en: 'Art speaks louder than words', ua: 'Мистецтво говорить голосніше за слова', ru: 'Искусство говорит громче слов' },
            description: { en: 'Singer, Eurovision winner, supports mobilization', ua: 'Співачка, переможниця Євробачення, підтримує мобілізацію', ru: 'Певица, победительница Евровидения, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/jamala',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/jamala' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 6,
            rating: 9,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oleksandr Ponomariov', ua: 'Олександр Пономарьов', ru: 'Александр Пономарёв' },
            quote: { en: 'We must all contribute', ua: 'Ми всі повинні робити внесок', ru: 'Мы все должны вносить вклад' },
            description: { en: 'Singer, supports mobilization', ua: 'Співак, підтримує мобілізацію', ru: 'Певец, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/ponomariov_official',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/ponomariov_official' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oksana Zabuzhko', ua: 'Оксана Забужко', ru: 'Оксана Забужко' },
            quote: { en: 'Culture is resistance', ua: 'Культура - це опір', ru: 'Культура - это сопротивление' },
            description: { en: 'Writer, supports mobilization and closed borders', ua: 'Письменниця, підтримує мобілізацію та закриті кордони', ru: 'Писательница, поддерживает мобилизацию и закрытые границы' },
            mainLink: 'https://www.instagram.com/oksana_zabuzhko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/oksana_zabuzhko' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 8,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'strong_support',
            bordersPosition: 'closed',
        },
        {
            name: { en: 'Yuriy Andrukhovych', ua: 'Юрій Андрухович', ru: 'Юрий Андрухович' },
            quote: { en: 'Literature as a form of resistance', ua: 'Література як форма опору', ru: 'Литература как форма сопротивления' },
            description: { en: 'Writer, supports mobilization', ua: 'Письменник, підтримує мобілізацію', ru: 'Писатель, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/yuriy_andrukhovych',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/yuriy_andrukhovych' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 6,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Svyatoslav Vakarchuk', ua: 'Святослав Вакарчук', ru: 'Святослав Вакарчук' },
            quote: { en: 'We need unity to win', ua: 'Нам потрібна єдність для перемоги', ru: 'Нам нужна единство для победы' },
            description: { en: 'Musician, frontman of Okean Elzy, supports mobilization', ua: 'Музикант, фронтмен Okean Elzy, підтримує мобілізацію', ru: 'Музыкант, фронтмен Okean Elzy, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/svyatoslav_vakarchuk',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/svyatoslav_vakarchuk' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 7,
            rating: 9,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Anastasia Kamenskykh', ua: 'Анастасія Каменських', ru: 'Анастасия Каменских' },
            quote: { en: 'Supporting Ukraine in every way', ua: 'Підтримую Україну всіма способами', ru: 'Поддерживаю Украину всеми способами' },
            description: { en: 'Singer, supports mobilization', ua: 'Співачка, підтримує мобілізацію', ru: 'Певица, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/kamenskih',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/kamenskih' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Potap', ua: 'Потап', ru: 'Потап' },
            quote: { en: 'Standing with Ukraine', ua: 'Стою з Україною', ru: 'Стою с Украиной' },
            description: { en: 'Musician, supports mobilization', ua: 'Музикант, підтримує мобілізацію', ru: 'Музыкант, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/potap',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/potap' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Ivan Dorn', ua: 'Іван Дорн', ru: 'Иван Дорн' },
            quote: { en: 'Music unites us', ua: 'Музика об\'єднує нас', ru: 'Музыка объединяет нас' },
            description: { en: 'Musician, neutral position on mobilization', ua: 'Музикант, нейтральна позиція щодо мобілізації', ru: 'Музыкант, нейтральная позиция по мобилизации' },
            mainLink: 'https://www.instagram.com/ivandorn',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/ivandorn' },
            ],
            categories: ['music'],
            ratio: 'neutral',
            tone: 0,
            rating: 8,
            piterTest: 'Unknown',
            mobilizationPosition: 'neutral',
            bordersPosition: 'open',
        },
        {
            name: { en: 'Monatik', ua: 'Монатік', ru: 'Монатик' },
            quote: { en: 'Creating music for Ukraine', ua: 'Створюю музику для України', ru: 'Создаю музыку для Украины' },
            description: { en: 'Singer, supports mobilization', ua: 'Співак, підтримує мобілізацію', ru: 'Певец, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/monatik',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/monatik' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 6,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oleksandr Pedan', ua: 'Олександр Педан', ru: 'Александр Педан' },
            quote: { en: 'Comedy helps us survive', ua: 'Комедія допомагає нам вижити', ru: 'Комедия помогает нам выжить' },
            description: { en: 'Comedian, supports mobilization', ua: 'Комік, підтримує мобілізацію', ru: 'Комедиант, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/pedan',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/pedan' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Yevhen Klopotenko', ua: 'Євген Клопотенко', ru: 'Евгений Клопотенко' },
            quote: { en: 'Ukrainian cuisine is our identity', ua: 'Українська кухня - це наша ідентичність', ru: 'Украинская кухня - это наша идентичность' },
            description: { en: 'Chef, supports mobilization', ua: 'Шеф-кухар, підтримує мобілізацію', ru: 'Шеф-повар, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/klopotenko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/klopotenko' },
            ],
            categories: ['food'],
            ratio: 'patriot',
            tone: 6,
            rating: 8,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oleksandr Tkachenko', ua: 'Олександр Ткаченко', ru: 'Александр Ткаченко' },
            quote: { en: 'Culture is our weapon', ua: 'Культура - це наша зброя', ru: 'Культура - это наше оружие' },
            description: { en: 'Former Minister of Culture, supports mobilization', ua: 'Колишній міністр культури, підтримує мобілізацію', ru: 'Бывший министр культуры, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/tkachenko_official',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/tkachenko_official' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 6,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Dmytro Shurov', ua: 'Дмитро Шуров', ru: 'Дмитрий Шуров' },
            quote: { en: 'Music is my way to support Ukraine', ua: 'Музика - мій спосіб підтримати Україну', ru: 'Музыка - мой способ поддержать Украину' },
            description: { en: 'Musician, pianist, supports mobilization', ua: 'Музикант, піаніст, підтримує мобілізацію', ru: 'Музыкант, пианист, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/dmytro_shurov',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/dmytro_shurov' },
            ],
            categories: ['music'],
            ratio: 'patriot',
            tone: 6,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oleksandr Pashayev', ua: 'Олександр Пашаєв', ru: 'Александр Пашаев' },
            quote: { en: 'Standing with my country', ua: 'Стою зі своєю країною', ru: 'Стою со своей страной' },
            description: { en: 'TV presenter, supports mobilization', ua: 'Телеведучий, підтримує мобілізацію', ru: 'Телеведущий, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/pashayev',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/pashayev' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
        },
        {
            name: { en: 'Oleksandr Skichko', ua: 'Олександр Скічко', ru: 'Александр Скичко' },
            quote: { en: 'Humor helps us fight', ua: 'Гумор допомагає нам боротися', ru: 'Юмор помогает нам бороться' },
            description: { en: 'TV presenter, comedian, supports mobilization', ua: 'Телеведучий, комік, підтримує мобілізацію', ru: 'Телеведущий, комедиант, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/skichko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/skichko' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 5,
            rating: 7,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=example1', description: { en: 'Interview about mobilization', ua: 'Інтерв\'ю про мобілізацію', ru: 'Интервью о мобилизации' } },
            ],
        },
        {
            name: { en: 'Oleksandr Zinchenko', ua: 'Олександр Зінченко', ru: 'Александр Зинченко' },
            quote: { en: 'Footballer supporting Ukraine', ua: 'Футболіст, який підтримує Україну', ru: 'Футболист, поддерживающий Украину' },
            description: { en: 'Football player, supports mobilization', ua: 'Футболіст, підтримує мобілізацію', ru: 'Футболист, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/zinchenko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/zinchenko' },
            ],
            categories: ['sports'],
            ratio: 'patriot',
            tone: 6,
            rating: 9,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=zinchenko1', description: { en: 'Statement about supporting Ukraine', ua: 'Заява про підтримку України', ru: 'Заявление о поддержке Украины' } },
                { url: 'https://www.youtube.com/watch?v=zinchenko2', description: { en: 'Interview about mobilization', ua: 'Інтерв\'ю про мобілізацію', ru: 'Интервью о мобилизации' } },
            ],
        },
        {
            name: { en: 'Andriy Shevchenko', ua: 'Андрій Шевченко', ru: 'Андрей Шевченко' },
            quote: { en: 'Ukraine will win', ua: 'Україна переможе', ru: 'Украина победит' },
            description: { en: 'Former footballer, coach, supports mobilization', ua: 'Колишній футболіст, тренер, підтримує мобілізацію', ru: 'Бывший футболист, тренер, поддерживает мобилизацию' },
            mainLink: 'https://www.instagram.com/shevchenko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/shevchenko' },
            ],
            categories: ['sports'],
            ratio: 'patriot',
            tone: 7,
            rating: 9,
            piterTest: 'True',
            mobilizationPosition: 'support',
            bordersPosition: 'neutral',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=shevchenko1', description: { en: 'Interview about Ukraine and mobilization', ua: 'Інтерв\'ю про Україну та мобілізацію', ru: 'Интервью об Украине и мобилизации' } },
                { url: 'https://www.youtube.com/watch?v=shevchenko2', description: { en: 'Statement supporting Ukrainian army', ua: 'Заява про підтримку української армії', ru: 'Заявление о поддержке украинской армии' } },
            ],
        },
        {
            name: { en: 'Oleksandr Usyk (Boxer)', ua: 'Олександр Усик (Боксер)', ru: 'Александр Усик (Боксер)' },
            quote: { en: 'I fight for my country', ua: 'Я б\'юся за свою країну', ru: 'Я сражаюсь за свою страну' },
            description: { en: 'Boxing champion, strong supporter of mobilization', ua: 'Чемпіон з боксу, активний прихильник мобілізації', ru: 'Чемпион по боксу, активный сторонник мобилизации' },
            mainLink: 'https://www.instagram.com/usykaa',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/usykaa' },
            ],
            categories: ['sports'],
            ratio: 'patriot',
            tone: 8,
            rating: 10,
            piterTest: 'True',
            mobilizationPosition: 'strong_support',
            bordersPosition: 'closed',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=usyk1', description: { en: 'Interview about returning to Ukraine', ua: 'Інтерв\'ю про повернення в Україну', ru: 'Интервью о возвращении в Украину' } },
                { url: 'https://www.youtube.com/watch?v=usyk2', description: { en: 'Statement about mobilization support', ua: 'Заява про підтримку мобілізації', ru: 'Заявление о поддержке мобилизации' } },
                { url: 'https://www.youtube.com/watch?v=usyk3', description: { en: 'Message to Ukrainian soldiers', ua: 'Звернення до українських воїнів', ru: 'Обращение к украинским воинам' } },
            ],
        },
        {
            name: { en: 'Olena Zelenska', ua: 'Олена Зеленська', ru: 'Елена Зеленская' },
            quote: { en: 'Supporting Ukraine in every way', ua: 'Підтримую Україну всіма способами', ru: 'Поддерживаю Украину всеми способами' },
            description: { en: 'First Lady of Ukraine, supports mobilization and closed borders', ua: 'Перша леді України, підтримує мобілізацію та закриті кордони', ru: 'Первая леди Украины, поддерживает мобилизацию и закрытые границы' },
            mainLink: 'https://www.instagram.com/olenazelenska_official',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/olenazelenska_official' },
            ],
            categories: ['lifestyle'],
            ratio: 'patriot',
            tone: 9,
            rating: 10,
            piterTest: 'True',
            mobilizationPosition: 'strong_support',
            bordersPosition: 'closed',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=zelenska1', description: { en: 'Speech about supporting Ukrainian army', ua: 'Промова про підтримку української армії', ru: 'Речь о поддержке украинской армии' } },
                { url: 'https://www.youtube.com/watch?v=zelenska2', description: { en: 'Interview about closed borders', ua: 'Інтерв\'ю про закриті кордони', ru: 'Интервью о закрытых границах' } },
            ],
        },
        {
            name: { en: 'Yuriy Hudymenko', ua: 'Юрій Гудименко', ru: 'Юрий Гудименко' },
            quote: { en: 'Neutral position on mobilization', ua: 'Нейтральна позиція щодо мобілізації', ru: 'Нейтральная позиция по мобилизации' },
            description: { en: 'Blogger, neutral position', ua: 'Блогер, нейтральна позиція', ru: 'Блогер, нейтральная позиция' },
            mainLink: 'https://www.instagram.com/hudymenko',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/hudymenko' },
            ],
            categories: ['lifestyle'],
            ratio: 'neutral',
            tone: 0,
            rating: 5,
            piterTest: 'Unknown',
            mobilizationPosition: 'neutral',
            bordersPosition: 'open',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=hudymenko1', description: { en: 'Neutral statement about mobilization', ua: 'Нейтральна заява про мобілізацію', ru: 'Нейтральное заявление о мобилизации' } },
            ],
        },
        {
            name: { en: 'Oleksandr Feldman', ua: 'Олександр Фельдман', ru: 'Александр Фельдман' },
            quote: { en: 'Against forced mobilization', ua: 'Проти примусової мобілізації', ru: 'Против принудительной мобилизации' },
            description: { en: 'Businessman, against mobilization, supports open borders', ua: 'Бізнесмен, проти мобілізації, підтримує відкриті кордони', ru: 'Бизнесмен, против мобилизации, поддерживает открытые границы' },
            mainLink: 'https://www.instagram.com/feldman',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/feldman' },
            ],
            categories: ['lifestyle'],
            ratio: 'traitor',
            tone: -7,
            rating: 3,
            piterTest: 'False',
            mobilizationPosition: 'against',
            bordersPosition: 'open',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=feldman1', description: { en: 'Statement against mobilization', ua: 'Заява проти мобілізації', ru: 'Заявление против мобилизации' } },
                { url: 'https://www.youtube.com/watch?v=feldman2', description: { en: 'Interview about open borders', ua: 'Інтерв\'ю про відкриті кордони', ru: 'Интервью об открытых границах' } },
            ],
        },
        {
            name: { en: 'Ihor Kolomoisky', ua: 'Ігор Коломойський', ru: 'Игорь Коломойский' },
            quote: { en: 'Business should be free', ua: 'Бізнес повинен бути вільним', ru: 'Бизнес должен быть свободным' },
            description: { en: 'Businessman, against mobilization, supports open borders', ua: 'Бізнесмен, проти мобілізації, підтримує відкриті кордони', ru: 'Бизнесмен, против мобилизации, поддерживает открытые границы' },
            mainLink: 'https://www.instagram.com/kolomoisky',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/kolomoisky' },
            ],
            categories: ['lifestyle'],
            ratio: 'traitor',
            tone: -8,
            rating: 2,
            piterTest: 'False',
            mobilizationPosition: 'strong_against',
            bordersPosition: 'open',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=kolomoisky1', description: { en: 'Statement against mobilization', ua: 'Заява проти мобілізації', ru: 'Заявление против мобилизации' } },
                { url: 'https://www.youtube.com/watch?v=kolomoisky2', description: { en: 'Interview about business and borders', ua: 'Інтерв\'ю про бізнес та кордони', ru: 'Интервью о бизнесе и границах' } },
            ],
        },
        {
            name: { en: 'Viktor Medvedchuk', ua: 'Віктор Медведчук', ru: 'Виктор Медведчук' },
            quote: { en: 'Against mobilization', ua: 'Проти мобілізації', ru: 'Против мобилизации' },
            description: { en: 'Politician, against mobilization, supports open borders', ua: 'Політик, проти мобілізації, підтримує відкриті кордони', ru: 'Политик, против мобилизации, поддерживает открытые границы' },
            mainLink: 'https://www.instagram.com/medvedchuk',
            platforms: [
                { slug: 'instagram', url: 'https://www.instagram.com/medvedchuk' },
            ],
            categories: ['lifestyle'],
            ratio: 'traitor',
            tone: -9,
            rating: 1,
            piterTest: 'False',
            mobilizationPosition: 'strong_against',
            bordersPosition: 'open',
            proofs: [
                { url: 'https://www.youtube.com/watch?v=medvedchuk1', description: { en: 'Statement against mobilization', ua: 'Заява проти мобілізації', ru: 'Заявление против мобилизации' } },
                { url: 'https://www.youtube.com/watch?v=medvedchuk2', description: { en: 'Interview about open borders policy', ua: 'Інтерв\'ю про політику відкритих кордонів', ru: 'Интервью о политике открытых границ' } },
            ],
        },
    ];

    console.log(`\n📝 Creating ${bloggers.length} Ukrainian bloggers...`);

    for (let i = 0; i < bloggers.length; i++) {
        const blogger = bloggers[i];
        
        // Get or create categories
        const selectedCategories = [];
        for (const catSlug of blogger.categories) {
            if (categoryMap[catSlug]) {
                selectedCategories.push(categoryMap[catSlug]);
            }
        }

        // Get ratio
        const selectedRatio = ratioMap[blogger.ratio];
        if (!selectedRatio) {
            console.error(`❌ Ratio not found: ${blogger.ratio}`);
            continue;
        }

        // Create content creator
        const creator = await prisma.contentCreator.create({
            data: {
                name: blogger.name,
                quote: blogger.quote,
                description: blogger.description,
                locale: 'uk-UA',
                mainLink: blogger.mainLink,
                rating: blogger.rating,
                position: 1000 + i + 1, // Start from 1000 to avoid conflicts
                status: 'active',
                contentFormats: ['video', 'photo', 'text'],
                tone: blogger.tone,
                audience: {
                    age: [25, 45],
                    geo: ['UA'],
                    level: ['intermediate', 'advanced'],
                },
                metrics: {
                    engagementRate: parseFloat((Math.random() * 3 + 3).toFixed(1)), // 3-6%
                    postingFrequency: 'daily',
                    followers: Math.floor(Math.random() * 500000 + 100000), // 100k-600k
                },
                piterTest: blogger.piterTest,
                createdBy: { connect: { id: adminUser.id } },
                categories: selectedCategories.length > 0 ? {
                    create: selectedCategories.map((category) => ({
                        category: { connect: { id: category.id } },
                    })),
                } : undefined,
                ratio: {
                    create: {
                        ratio: { connect: { id: selectedRatio.id } },
                    },
                },
                platforms: blogger.platforms ? {
                    create: blogger.platforms.map((platform) => {
                        const platformObj = platformMap[platform.slug];
                        if (!platformObj) {
                            console.error(`❌ Platform not found: ${platform.slug}`);
                            return null;
                        }
                        return {
                            platform: { connect: { id: platformObj.id } },
                            url: platform.url,
                        };
                    }).filter(p => p !== null),
                } : undefined,
                proofs: blogger.proofs ? {
                    create: blogger.proofs.map((proof) => ({
                        url: proof.url,
                        description: proof.description || null,
                    })),
                } : undefined,
                statusHistory: {
                    create: {
                        previousStatus: null,
                        newStatus: 'active',
                        changedById: adminUser.id,
                    },
                },
            },
        });

        console.log(`✅ Created: ${blogger.name.ua} (${blogger.ratio}, tone: ${blogger.tone}, mobilization: ${blogger.mobilizationPosition}, borders: ${blogger.bordersPosition})`);
    }

    console.log(`\n🎉 Seeding completed successfully!`);
    console.log(`📊 Created ${bloggers.length} Ukrainian bloggers`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
