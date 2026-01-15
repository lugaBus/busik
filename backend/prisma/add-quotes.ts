import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const quotes = [
  {
    ua: "Тільки жорстка лінія захисту національних інтересів дасть результат.",
    en: "Only a tough line of defense of national interests will yield results.",
    ru: "Только жесткая линия защиты национальных интересов даст результат.",
  },
  {
    ua: "Наразі я спостерігаю за розвитком ситуації. Мої висновки будуть пізніше.",
    en: "Currently, I am observing the situation's development. My conclusions will be later.",
    ru: "В настоящее время я наблюдаю за развитием ситуации. Мои выводы будут позже.",
  },
  {
    ua: "Ми не маємо провокувати конфлікт. Потрібен компроміс будь-якою ціною.",
    en: "We should not provoke conflict. Compromise is needed at any cost.",
    ru: "Мы не должны провоцировать конфликт. Нужен компромисс любой ценой.",
  },
  {
    ua: "Підтримую кожну ініціативу, що веде до нашої перемоги. Майбутнє за єдністю.",
    en: "I support every initiative that leads to our victory. The future is in unity.",
    ru: "Поддерживаю каждую инициативу, ведущую к нашей победе. Будущее в единстве.",
  },
  {
    ua: "Мистецтво поза політикою. Я просто хочу співати для всіх.",
    en: "Art is outside of politics. I just want to sing for everyone.",
    ru: "Искусство вне политики. Я просто хочу петь для всех.",
  },
  {
    ua: "Демократія потребує активного громадянського суспільства.",
    en: "Democracy requires an active civil society.",
    ru: "Демократия требует активного гражданского общества.",
  },
  {
    ua: "Економічна стабільність - основа процвітання нації.",
    en: "Economic stability is the foundation of a nation's prosperity.",
    ru: "Экономическая стабильность - основа процветания нации.",
  },
  {
    ua: "Освіта - це інвестиція в майбутнє наших дітей.",
    en: "Education is an investment in our children's future.",
    ru: "Образование - это инвестиция в будущее наших детей.",
  },
  {
    ua: "Прозорість та відкритість - ключ до довіри громадян.",
    en: "Transparency and openness are the keys to citizens' trust.",
    ru: "Прозрачность и открытость - ключ к доверию граждан.",
  },
  {
    ua: "Кожен має право на власну думку, але також і відповідальність за неї.",
    en: "Everyone has the right to their own opinion, but also responsibility for it.",
    ru: "Каждый имеет право на собственное мнение, но также и ответственность за него.",
  },
];

async function main() {
  console.log('🔄 Adding quotes to existing content creators...');

  const allCreators = await prisma.contentCreator.findMany();

  console.log(`Found ${allCreators.length} creators total`);

  for (const creator of allCreators) {
    // Check if quote is null or empty
    const hasQuote = creator.quote && 
      typeof creator.quote === 'object' && 
      !Array.isArray(creator.quote) &&
      (creator.quote as any).ua !== undefined;
    
    if (!hasQuote) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      await prisma.contentCreator.update({
        where: { id: creator.id },
        data: {
          quote: randomQuote,
        },
      });

      console.log(`✅ Added quote to creator: ${creator.id}`);
    } else {
      console.log(`⏭️  Creator ${creator.id} already has a quote`);
    }
  }

  console.log('🎉 Quotes added successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Failed to add quotes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
