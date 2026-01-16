import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper functions
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const randomChoices = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

// Normal distribution helper (Box-Muller transform)
const normalRandom = (mean: number, stdDev: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Test1234$%', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin42@lugabus.com' },
    update: {},
    create: {
      email: 'admin42@lugabus.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });
  console.log('✅ Admin user ready');

  // Create categories
  const categories = [
    { name: { en: 'Lifestyle', ua: 'Стиль життя', ru: 'Стиль жизни' }, slug: 'lifestyle' },
    { name: { en: 'Fashion', ua: 'Мода', ru: 'Мода' }, slug: 'fashion' },
    { name: { en: 'Beauty', ua: 'Краса', ru: 'Красота' }, slug: 'beauty' },
    { name: { en: 'Gaming', ua: 'Ігри', ru: 'Игры' }, slug: 'gaming' },
    { name: { en: 'Music', ua: 'Музика', ru: 'Музыка' }, slug: 'music' },
    { name: { en: 'Sports', ua: 'Спорт', ru: 'Спорт' }, slug: 'sports' },
    { name: { en: 'Tech', ua: 'Технології', ru: 'Технологии' }, slug: 'tech' },
    { name: { en: 'Food', ua: 'Їжа', ru: 'Еда' }, slug: 'food' },
  ];

  const createdCategories: Array<{ id: string; slug: string }> = [];
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (!existing) {
      const created = await prisma.category.create({ data: cat });
      createdCategories.push(created);
      console.log(`✅ Created category: ${cat.slug}`);
    } else {
      createdCategories.push(existing);
      console.log(`⏭️  Category already exists: ${cat.slug}`);
    }
  }

  // Create ratios
  const ratios = [
    { name: { en: 'Patriot', ua: 'Патріот', ru: 'Патриот' }, slug: 'patriot' },
    { name: { en: 'Neutral', ua: 'Нейтральний', ru: 'Нейтральный' }, slug: 'neutral' },
    { name: { en: 'Traitor', ua: 'Зрадник', ru: 'Предатель' }, slug: 'traitor' },
  ];

  const createdRatios: Array<{ id: string; slug: string }> = [];
  for (const ratio of ratios) {
    const existing = await prisma.ratio.findUnique({
      where: { slug: ratio.slug },
    });
    if (!existing) {
      const created = await prisma.ratio.create({ data: ratio });
      createdRatios.push(created);
      console.log(`✅ Created ratio: ${ratio.slug}`);
    } else {
      createdRatios.push(existing);
      console.log(`⏭️  Ratio already exists: ${ratio.slug}`);
    }
  }

  // Name templates
  const nameTemplates = [
    { en: 'Alex Creator', ua: 'Алекс Творець', ru: 'Алекс Творец' },
    { en: 'Maria Influencer', ua: 'Марія Інфлюенсер', ru: 'Мария Инфлюенсер' },
    { en: 'John Blogger', ua: 'Джон Блогер', ru: 'Джон Блогер' },
    { en: 'Anna Content', ua: 'Анна Контент', ru: 'Анна Контент' },
    { en: 'Mike Streamer', ua: 'Майк Стрімер', ru: 'Майк Стример' },
    { en: 'Sofia Vlogger', ua: 'Софія Влогер', ru: 'София Влогер' },
    { en: 'David Creator', ua: 'Давид Творець', ru: 'Давид Творец' },
    { en: 'Emma Influencer', ua: 'Емма Інфлюенсер', ru: 'Эмма Инфлюенсер' },
    { en: 'Lucas Blogger', ua: 'Лукас Блогер', ru: 'Лукас Блогер' },
    { en: 'Olivia Content', ua: 'Олівія Контент', ru: 'Оливия Контент' },
  ];

  const quoteTemplates = [
    { en: 'Creating amazing content daily', ua: 'Створюю чудовий контент щодня', ru: 'Создаю отличный контент каждый день' },
    { en: 'Sharing my passion with the world', ua: 'Ділюся своєю пристрастю зі світом', ru: 'Делюсь своей страстью с миром' },
    { en: 'Inspiring others through creativity', ua: 'Надихаю інших через творчість', ru: 'Вдохновляю других через творчество' },
    { en: 'Building a community of like-minded people', ua: 'Будую спільноту однодумців', ru: 'Строю сообщество единомышленников' },
    { en: 'Living life to the fullest', ua: 'Живу життям на повну', ru: 'Живу жизнью на полную' },
  ];

  const descriptionTemplates = [
    { en: 'Content creator passionate about sharing knowledge and experiences', ua: 'Творець контенту, який захоплюється обміном знаннями та досвідом', ru: 'Создатель контента, увлеченный обменом знаниями и опытом' },
    { en: 'Influencer focused on lifestyle and personal development', ua: 'Інфлюенсер, зосереджений на стилі життя та особистому розвитку', ru: 'Инфлюенсер, сосредоточенный на образе жизни и личностном развитии' },
    { en: 'Creator making content about daily life and adventures', ua: 'Творець, який створює контент про повсякденне життя та пригоди', ru: 'Создатель, делающий контент о повседневной жизни и приключениях' },
  ];

  const locales = ['uk-UA', 'en-US', 'ru-RU'];
  const statuses = ['active', 'active', 'active', 'active', 'active', 'pending', 'inactive']; // 70% active
  const contentFormatsOptions = ['video', 'photo', 'text', 'story', 'reels'];
  const piterTestValues = ['True', 'False', 'Unknown'];
  const geoOptions = ['UA', 'PL', 'US', 'EU'];
  const levelOptions = ['beginner', 'intermediate', 'advanced'];
  const postingFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly'];

  // Generate 100 content creators with normal distribution
  console.log('\n📝 Creating 100 content creators...');

  for (let i = 0; i < 100; i++) {
    // Normal distribution for rating (mean: 5.5, std: 2) - most will be around 4-7
    let rating = Math.round(normalRandom(5.5, 2));
    rating = Math.max(1, Math.min(10, rating)); // Clamp between 1 and 10

    // Normal distribution for tone (mean: 0, std: 3) - most will be around -3 to +3
    let tone = Math.round(normalRandom(0, 3));
    tone = Math.max(-10, Math.min(10, tone)); // Clamp between -10 and 10

    // Category distribution: 40% have 1 category, 40% have 2, 20% have 3
    const categoryRand = Math.random();
    let categoryCount = 1;
    if (categoryRand < 0.4) categoryCount = 1;
    else if (categoryRand < 0.8) categoryCount = 2;
    else categoryCount = 3;

    const selectedCategories = randomChoices(createdCategories, categoryCount);

    // Ratio distribution: 50% patriot, 30% neutral, 20% traitor
    const ratioRand = Math.random();
    let selectedRatio;
    if (ratioRand < 0.5) {
      selectedRatio = createdRatios.find(r => r.slug === 'patriot');
    } else if (ratioRand < 0.8) {
      selectedRatio = createdRatios.find(r => r.slug === 'neutral');
    } else {
      selectedRatio = createdRatios.find(r => r.slug === 'traitor');
    }
    if (!selectedRatio) selectedRatio = createdRatios[0];

    const name = nameTemplates[i % nameTemplates.length];
    const quote = randomChoice(quoteTemplates);
    const description = randomChoice(descriptionTemplates);
    const locale = randomChoice(locales);
    const status = randomChoice(statuses);
    const contentFormats = randomChoices(contentFormatsOptions, randomInt(1, 3));
    const piterTest = randomChoice(piterTestValues);
    const ageMin = randomInt(18, 25);
    const ageMax = randomInt(30, 50);
    const geoCount = randomInt(1, 3);
    const geo = randomChoices(geoOptions, geoCount);
    const levelCount = randomInt(1, 2);
    const level = randomChoices(levelOptions, levelCount);
    const engagementRate = parseFloat(randomFloat(2.5, 8.0).toFixed(1));
    const postingFrequency = randomChoice(postingFrequencies);
    const followers = randomInt(10000, 1000000);

    const creator = await prisma.contentCreator.create({
      data: {
        name,
        quote,
        description,
        locale,
        mainLink: `https://creator${i + 1}.example.com`,
        rating,
        position: i + 1,
        status,
        contentFormats,
        tone,
        audience: { age: [ageMin, ageMax], geo, level },
        metrics: { engagementRate, postingFrequency, followers },
        piterTest,
        createdBy: { connect: { id: adminUser.id } },
        categories: selectedCategories.length > 0 ? {
          create: selectedCategories.map((category) => ({
            category: { connect: { id: category.id } },
          })),
        } : undefined,
        ratio: selectedRatio ? {
          create: {
            ratio: { connect: { id: selectedRatio.id } },
          },
        } : undefined,
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: status,
            changedById: adminUser.id,
          },
        },
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1}/100 content creators`);
    }
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log(`📊 Created 100 content creators`);
  console.log(`📁 Categories: ${createdCategories.length}`);
  console.log(`⭐ Ratios: ${createdRatios.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
