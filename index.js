import { Markup, Telegraf } from "telegraf";
import quotes from "success-motivational-quotes";

import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);



const categories = [
  "Albert Einstein", "Donald Trump", "Abraham Lincoln", "Anthony Robbins", "Brian Tracey",
  "Dale Carnegie", "Dennis Waitley", "Earl Nightingale", "Jim Rohn", "Mark Victor Hansen",
  "Napoleon Hill", "Norman Vincent Peale", "Ralph Waldo Emerson", "Robert H. Schuller",
  "Robert T. Kiyosaki", "Thomas Edison", "Thomas Jefferson", "W. Clement Stone", "Zig Ziglar",
  "Taking Action", "Adversity", "Attitude", "Think Big", "Goals", "Learning", "Persistence",
  "Preparation", "Taking Risks", "Work", "Motivational", "Bill Gates", "Elon Musk", "Leadership",
  "Business", "Inspirational", "Success", "New", "Random"
];

const pageSize = 6;
const userPageMap = {}; // userId → current page

// 🔁 Create category keyboard with pagination
function getKeyboardForPage(page = 0) {
  const fixedTop = [["New", "Random"]];
  const filteredCats = categories.filter(c => c !== "New" && c !== "Random");

  const start = page * pageSize;
  const end = start + pageSize;
  const currentCats = filteredCats.slice(start, end);

  const catRows = [];
  for (let i = 0; i < currentCats.length; i += 2) {
    catRows.push(currentCats.slice(i, i + 2));
  }

  const nav = [];
  if (page > 0) nav.push("⬅️ Back");
  if (end < filteredCats.length) nav.push("➡️ Next");

  return Markup.keyboard([...fixedTop, ...catRows, nav])
    .resize()
    .oneTime(false);
}

// 🎯 Send quote with “Another” button
function sendQuoteWithButton(ctx, category) {
  let quote;
  if (category === "Random" || category === "New") {
    quote = quotes.getTodaysQuote();
  } else {
    const list = quotes.getQuotesByCategory(category);
    quote = list[Math.floor(Math.random() * list.length)];
  }

  ctx.reply(
    `📝 "${quote.body}"\n— ${quote.by}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🎲 Another Quote", `another_${category}`)]
    ])
  );
}

// 🟢 START command
bot.start((ctx) => {
  userPageMap[ctx.chat.id] = 0;
  ctx.reply("💬 Choose a quote category:", getKeyboardForPage(0));
});

// 🔁 Handle pagination
bot.hears("➡️ Next", (ctx) => {
  let page = userPageMap[ctx.chat.id] || 0;
  page++;
  userPageMap[ctx.chat.id] = page;
  ctx.reply("👉 Next Categories:", getKeyboardForPage(page));
});

bot.hears("⬅️ Back", (ctx) => {
  let page = userPageMap[ctx.chat.id] || 0;
  if (page > 0) page--;
  userPageMap[ctx.chat.id] = page;
  ctx.reply("👈 Previous Categories:", getKeyboardForPage(page));
});

// 📥 Handle category clicks
bot.hears(categories, (ctx) => {
  const category = ctx.message.text;
  sendQuoteWithButton(ctx, category);
});

// 🎲 Handle “Another Quote” inline button
bot.on("callback_query", (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("another_")) {
    const category = data.replace("another_", "");
    let quote;
    if (category === "Random" || category === "New") {
      quote = quotes.getTodaysQuote();
    } else {
      const list = quotes.getQuotesByCategory(category);
      quote = list[Math.floor(Math.random() * list.length)];
    }

    ctx.editMessageText(
      `📝 "${quote.body}"\n— ${quote.by}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🎲 Another Quote", `another_${category}`)]
      ])
    );
  }

  ctx.answerCbQuery();
});

bot.launch();
console.log("🚀 Bot is running...");
