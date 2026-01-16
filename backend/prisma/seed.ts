import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // User permissions
    { name: 'users:read', resource: 'users', action: 'read', description: 'Read users' },
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Role permissions
    { name: 'roles:read', resource: 'roles', action: 'read', description: 'Read roles' },
    { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles' },
    { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
    { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
    
    // Audit permissions
    { name: 'audit:read', resource: 'audit', action: 'read', description: 'Read audit logs' },
    
    // Content permissions
    { name: 'content:read', resource: 'content', action: 'read', description: 'Read content' },
    { name: 'content:create', resource: 'content', action: 'create', description: 'Create content' },
    { name: 'content:update', resource: 'content', action: 'update', description: 'Update content' },
    { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { name: perm.name },
    });
    
    if (!existing) {
      const created = await prisma.permission.create({ data: perm });
      createdPermissions.push(created);
      console.log(`✅ Created permission: ${perm.name}`);
    } else {
      createdPermissions.push(existing);
      console.log(`⏭️  Permission already exists: ${perm.name}`);
    }
  }

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });
  console.log('✅ Created/updated admin role');

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with limited access',
    },
  });
  console.log('✅ Created/updated user role');

  // Assign all permissions to admin role
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Assigned all permissions to admin role');

  // Assign basic permissions to user role
  const userPermissions = createdPermissions.filter(
    (p) => p.name.startsWith('content:read') || p.name === 'content:read',
  );
  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('✅ Assigned basic permissions to user role');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Test1234$%', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin42@lugabus.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin42@lugabus.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });
  console.log('✅ Created admin user: admin42@lugabus.com / Test1234$%');

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log('✅ Assigned admin role to admin user');

  // Create test user
  const testUserPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@lugabus.com' },
    update: {},
    create: {
      email: 'user@lugabus.com',
      password: testUserPassword,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    },
  });
  console.log('✅ Created test user: user@lugabus.com / user123');

  // Assign user role to test user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: testUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      roleId: userRole.id,
    },
  });
  console.log('✅ Assigned user role to test user');

  // Create categories for content creators
  const categories = [
    { name: { en: 'Technology', ua: 'Технології', ru: 'Технологии' }, slug: 'technology' },
    { name: { en: 'Fashion', ua: 'Мода', ru: 'Мода' }, slug: 'fashion' },
    { name: { en: 'Food', ua: 'Їжа', ru: 'Еда' }, slug: 'food' },
    { name: { en: 'Travel', ua: 'Подорожі', ru: 'Путешествия' }, slug: 'travel' },
    { name: { en: 'Fitness', ua: 'Фітнес', ru: 'Фитнес' }, slug: 'fitness' },
    { name: { en: 'Beauty', ua: 'Краса', ru: 'Красота' }, slug: 'beauty' },
    { name: { en: 'Gaming', ua: 'Ігри', ru: 'Игры' }, slug: 'gaming' },
    { name: { en: 'Music', ua: 'Музика', ru: 'Музыка' }, slug: 'music' },
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

  // Delete old ratios (1:1, 16:9, 9:16, 4:3) if they exist
  const oldRatioSlugs = ['1-1', '16-9', '9-16', '4-3'];
  for (const slug of oldRatioSlugs) {
    const oldRatio = await prisma.ratio.findUnique({
      where: { slug },
    });
    if (oldRatio) {
      await prisma.ratio.delete({
        where: { slug },
      });
      console.log(`🗑️  Deleted old ratio: ${slug}`);
    }
  }

  // Create ratios for content creators
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

  // Helper functions for randomization
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomChoices = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
  };

  const locales = ['uk-UA', 'en-US', 'ru-RU'];
  const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending'];
  const contentFormatsOptions = ['video', 'photo', 'story', 'reels', 'audio', 'stream'];
  const piterTestValues = ['True', 'False', 'Unknown'];
  const geoOptions = ['UA', 'PL', 'US', 'RU', 'EU', 'GB', 'DE', 'FR'];
  const levelOptions = ['beginner', 'intermediate', 'advanced'];
  const postingFrequencies = ['daily', '2 times per week', '3 times per week', '4 times per week', '5 times per week', 'weekly'];

  // Diverse name templates for content creators
  const nameTemplates = [
    { en: 'Oleksandr Petrov', ua: 'Олександр Петров', ru: 'Александр Петров' },
    { en: 'Maria Kovalenko', ua: 'Марія Коваленко', ru: 'Мария Коваленко' },
    { en: 'Dmytro Shevchenko', ua: 'Дмитро Шевченко', ru: 'Дмитрий Шевченко' },
    { en: 'Anna Melnyk', ua: 'Анна Мельник', ru: 'Анна Мельник' },
    { en: 'Ivan Bondarenko', ua: 'Іван Бондаренко', ru: 'Иван Бондаренко' },
    { en: 'Olena Tkachenko', ua: 'Олена Ткаченко', ru: 'Елена Ткаченко' },
    { en: 'Andriy Hryhorovych', ua: 'Андрій Григорович', ru: 'Андрей Григорович' },
    { en: 'Natalia Savchenko', ua: 'Наталія Савченко', ru: 'Наталия Савченко' },
    { en: 'Viktor Morozov', ua: 'Віктор Морозов', ru: 'Виктор Морозов' },
    { en: 'Yulia Kravchenko', ua: 'Юлія Кравченко', ru: 'Юлия Кравченко' },
    { en: 'Serhii Volkov', ua: 'Сергій Волков', ru: 'Сергей Волков' },
    { en: 'Tetiana Romanenko', ua: 'Тетяна Роменко', ru: 'Татьяна Роменко' },
    { en: 'Pavlo Lysenko', ua: 'Павло Лисенко', ru: 'Павел Лысенко' },
    { en: 'Kateryna Hrytsenko', ua: 'Катерина Гриценко', ru: 'Екатерина Гриценко' },
    { en: 'Mykhailo Fedorov', ua: 'Михайло Федоров', ru: 'Михаил Федоров' },
    { en: 'Valentyna Sydorenko', ua: 'Валентина Сидоренко', ru: 'Валентина Сидоренко' },
    { en: 'Oleh Zaitsev', ua: 'Олег Зайцев', ru: 'Олег Зайцев' },
    { en: 'Iryna Makarenko', ua: 'Ірина Макаренко', ru: 'Ирина Макаренко' },
    { en: 'Roman Ponomarenko', ua: 'Роман Пономаренко', ru: 'Роман Пономаренко' },
    { en: 'Svitlana Kovalchuk', ua: 'Світлана Ковальчук', ru: 'Светлана Ковальчук' },
  ];

  const quoteTemplates = [
    { en: 'Innovation drives the future', ua: 'Інновації рухають майбутнє', ru: 'Инновации движут будущим' },
    { en: 'Style is a way to say who you are', ua: 'Стиль - це спосіб сказати, хто ти є', ru: 'Стиль - это способ сказать, кто ты' },
    { en: 'Food brings people together', ua: 'Їжа зближує людей', ru: 'Еда объединяет людей' },
    { en: 'Adventure awaits around every corner', ua: 'Пригоди чекають за кожним кутом', ru: 'Приключения ждут за каждым углом' },
    { en: 'Your body can do it, your mind needs to believe it', ua: 'Твоє тіло може це зробити, твій розум має повірити', ru: 'Твое тело может это сделать, твой разум должен поверить' },
    { en: 'Beauty is confidence applied to the face', ua: 'Краса - це впевненість, нанесена на обличчя', ru: 'Красота - это уверенность, нанесенная на лицо' },
    { en: 'Game on, level up', ua: 'Грай далі, підвищуй рівень', ru: 'Играй дальше, повышай уровень' },
    { en: 'Music is the universal language', ua: 'Музика - це універсальна мова', ru: 'Музыка - это универсальный язык' },
    { en: 'Testing the latest tech for you', ua: 'Тестую останню техніку для вас', ru: 'Тестирую последнюю технику для вас' },
    { en: 'Fashion is what you adopt when you don\'t know who you are', ua: 'Мода - це те, що ти приймаєш, коли не знаєш, хто ти', ru: 'Мода - это то, что ты принимаешь, когда не знаешь, кто ты' },
    { en: 'Cooking is love made visible', ua: 'Приготування їжі - це любов, зроблена видимою', ru: 'Приготовление еды - это любовь, сделанная видимой' },
    { en: 'Life is either a daring adventure or nothing', ua: 'Життя - це або смілива пригода, або нічого', ru: 'Жизнь - это либо смелое приключение, либо ничего' },
    { en: 'Yoga is the journey of the self, through the self, to the self', ua: 'Йога - це подорож себе, через себе, до себе', ru: 'Йога - это путешествие себя, через себя, к себе' },
    { en: 'Makeup is art, beauty is spirit', ua: 'Макіяж - це мистецтво, краса - це дух', ru: 'Макияж - это искусство, красота - это дух' },
    { en: 'Gaming is not a crime', ua: 'Геймінг - це не злочин', ru: 'Гейминг - это не преступление' },
  ];

  const descriptionTemplates = [
    { en: 'Technology enthusiast and gadget reviewer', ua: 'Ентузіаст технологій та оглядач гаджетів', ru: 'Энтузиаст технологий и обозреватель гаджетов' },
    { en: 'Fashion blogger and style influencer', ua: 'Модний блогер та стильний інфлюенсер', ru: 'Модный блогер и стильный инфлюенсер' },
    { en: 'Culinary enthusiast and restaurant reviewer', ua: 'Кулінарний ентузіаст та ресторанний критик', ru: 'Кулинарный энтузиаст и ресторанный критик' },
    { en: 'World traveler and adventure seeker', ua: 'Мандрівник світу та шукач пригод', ru: 'Путешественник мира и искатель приключений' },
    { en: 'Personal trainer and fitness motivator', ua: 'Персональний тренер та фітнес-мотиватор', ru: 'Персональный тренер и фитнес-мотиватор' },
    { en: 'Makeup artist and beauty influencer', ua: 'Візажист та бьюти-інфлюенсер', ru: 'Визажист и бьюти-инфлюенсер' },
    { en: 'Professional gamer and streamer', ua: 'Професійний геймер та стрімер', ru: 'Профессиональный геймер и стример' },
    { en: 'Music producer and DJ', ua: 'Музичний продюсер та ді-джей', ru: 'Музыкальный продюсер и ди-джей' },
    { en: 'Tech reviewer and unboxing specialist', ua: 'Оглядач техніки та спеціаліст з розпакування', ru: 'Обозреватель техники и специалист по распаковке' },
    { en: 'Fashion designer and style creator', ua: 'Дизайнер моди та творець стилю', ru: 'Дизайнер моды и создатель стиля' },
    { en: 'Professional chef and cooking instructor', ua: 'Професійний кухар та інструктор з кулінарії', ru: 'Профессиональный повар и инструктор по кулинарии' },
    { en: 'Extreme sports enthusiast and adventure vlogger', ua: 'Ентузіаст екстремальних видів спорту та пригодницький влогер', ru: 'Энтузиаст экстремальных видов спорта и приключенческий влогер' },
    { en: 'Yoga instructor and wellness coach', ua: 'Інструктор йоги та коуч з велнесу', ru: 'Инструктор йоги и коуч по велнесу' },
    { en: 'Beauty vlogger and makeup artist', ua: 'Бьюти-влогер та візажист', ru: 'Бьюти-влогер и визажист' },
    { en: 'Professional streamer and esports commentator', ua: 'Професійний стрімер та коментатор кіберспорту', ru: 'Профессиональный стример и комментатор киберспорта' },
  ];

  // Generate random content creator data
  const generateCreator = (index: number) => {
    const name = nameTemplates[index % nameTemplates.length];
    const quote = randomChoice(quoteTemplates);
    const description = randomChoice(descriptionTemplates);
    const locale = randomChoice(locales);
    const status = randomChoice(statuses);
    const rating = randomInt(1, 10);
    const tone = randomInt(-10, 10);
    const contentFormats = randomChoices(contentFormatsOptions, randomInt(1, 4));
    const piterTest = randomChoice(piterTestValues);
    const ageMin = randomInt(16, 25);
    const ageMax = randomInt(30, 55);
    const geoCount = randomInt(1, 4);
    const geo = randomChoices(geoOptions, geoCount);
    const levelCount = randomInt(1, 3);
    const level = randomChoices(levelOptions, levelCount);
    const engagementRate = parseFloat(randomFloat(3.0, 7.0).toFixed(1));
    const postingFrequency = randomChoice(postingFrequencies);
    const followers = randomInt(50000, 500000);
    const categoryCount = randomInt(1, 3);
    const selectedCategories = randomChoices(createdCategories, categoryCount);
    const ratioCount = randomInt(1, 2);
    const selectedRatios = randomChoices(createdRatios, ratioCount);

    return {
      name,
      quote,
      description,
      locale,
      mainLink: `https://creator${index + 1}.example.com`,
      rating,
      position: index + 1,
      status,
      contentFormats,
      tone,
      audience: { age: [ageMin, ageMax], geo, level },
      metrics: { engagementRate, postingFrequency, followers },
      piterTest,
      categoryIds: selectedCategories.map(c => c.id),
      ratioIds: selectedRatios.map(r => r.id),
    };
  };

  // Create mock content creators with diverse names and randomized values
  const mockCreators = Array.from({ length: 20 }, (_, i) => generateCreator(i));

  for (const creatorData of mockCreators) {
    const { categoryIds, ratioIds, ...creatorFields } = creatorData;
    
    const creator = await prisma.contentCreator.create({
      data: {
        ...creatorFields,
        createdBy: { connect: { id: adminUser.id } }, // All mock creators are created by admin
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        } : undefined,
        ratio: ratioIds && ratioIds.length > 0 ? {
          create: {
            ratio: { connect: { id: ratioIds[0] } },
          },
        } : undefined,
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: creatorFields.status,
            changedById: adminUser.id, // Created by admin
          },
        },
      },
    });
    console.log(`✅ Created content creator: ${(creatorData.name as any).en}`);
  }

  // Create additional 50 content creators, half of them with 'active' status
  const additionalCreators = Array.from({ length: 50 }, (_, i) => {
    const creator = generateCreator(20 + i);
    // First 25 are active, rest have random status
    const status = i < 25 ? 'active' : randomChoice(['inactive', 'pending']);
    return { ...creator, status };
  });

  for (const creatorData of additionalCreators) {
    const { categoryIds, ratioIds, ...creatorFields } = creatorData;
    
    const creator = await prisma.contentCreator.create({
      data: {
        ...creatorFields,
        createdBy: { connect: { id: adminUser.id } },
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        } : undefined,
        ratio: ratioIds && ratioIds.length > 0 ? {
          create: {
            ratio: { connect: { id: ratioIds[0] } },
          },
        } : undefined,
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: creatorFields.status,
            changedById: adminUser.id,
          },
        },
      },
    });
    console.log(`✅ Created content creator: ${(creatorData.name as any).en} (${creatorFields.status})`);
  }

  // Create a content creator with user_added status (added by user from frontend)
  const userAddedCreator = await prisma.contentCreator.create({
    data: {
      name: { en: 'New Creator', ua: 'Новий Творець', ru: 'Новый Творец' },
      quote: { en: 'Added by user from frontend', ua: 'Додано користувачем з фронтенду', ru: 'Добавлено пользователем с фронтенда' },
      description: { en: 'This creator was added by a regular user and needs admin approval', ua: 'Цей творець був доданий звичайним користувачем і потребує схвалення адміна', ru: 'Этот творец был добавлен обычным пользователем и требует одобрения админа' },
      locale: 'uk-UA',
      mainLink: 'https://useradded.example.com',
      position: 999,
      rating: null,
      contentFormats: ['video', 'photo'],
      tone: 0,
      audience: { age: [18, 35], geo: ['UA'], level: ['beginner'] },
      metrics: { engagementRate: 3.5, postingFrequency: 'weekly', followers: 5000 },
      piterTest: 'Unknown',
      status: 'user_added',
      createdBy: { connect: { id: testUser.id } },
      categories: createdCategories.length > 0 ? {
        create: [{
          category: { connect: { id: createdCategories[0].id } },
        }],
      } : undefined,
      ratio: createdRatios.length > 0 ? {
        create: {
          ratio: { connect: { id: createdRatios[0].id } },
        },
      } : undefined,
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: 'user_added',
          changedById: testUser.id,
        },
      },
    },
  });
  console.log(`✅ Created content creator with user_added status: ${userAddedCreator.id}`);

  // Create anonymous user for anonymous creators
  const anonymousUserPassword = await bcrypt.hash('anonymous', 10);
  const anonymousUser = await prisma.user.upsert({
    where: { email: 'anonymous@lugabus.com' },
    update: {},
    create: {
      email: 'anonymous@lugabus.com',
      password: anonymousUserPassword,
      firstName: 'Anonymous',
      lastName: 'User',
      isActive: true,
    },
  });
  console.log('✅ Created anonymous user: anonymous@lugabus.com');

  // Create a content creator with user_added status (added anonymously without authorization)
  const anonymousCreator = await prisma.contentCreator.create({
    data: {
      name: { en: 'Anonymous Creator', ua: 'Анонімний Творець', ru: 'Анонимный Творец' },
      quote: { en: 'Added anonymously', ua: 'Додано анонімно', ru: 'Добавлено анонимно' },
      description: { en: 'This creator was added without authorization', ua: 'Цей творець був доданий без авторизації', ru: 'Этот творец был добавлен без авторизации' },
      locale: 'uk-UA',
      mainLink: 'https://anonymous.example.com',
      position: 998,
      rating: null,
      contentFormats: ['video'],
      tone: 0,
      audience: { age: [20, 40], geo: ['UA'], level: ['beginner'] },
      metrics: { engagementRate: 2.8, postingFrequency: 'weekly', followers: 2000 },
      piterTest: 'Unknown',
      status: 'user_added',
      createdBy: { connect: { id: anonymousUser.id } }, // Link to anonymous user
      categories: createdCategories.length > 0 ? {
        create: [{
          category: { connect: { id: createdCategories[1]?.id || createdCategories[0].id } },
        }],
      } : undefined,
      ratio: createdRatios.length > 0 ? {
        create: {
          ratio: { connect: { id: createdRatios[1]?.id || createdRatios[0].id } },
        },
      } : undefined,
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: 'user_added',
          changedById: anonymousUser.id, // Created by anonymous user
        },
      },
    },
  });
  console.log(`✅ Created content creator with user_added status (anonymous): ${anonymousCreator.id}`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
