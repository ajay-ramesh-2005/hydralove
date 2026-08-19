/**
 * Exact HydraLove Character Emotion Messages Bank
 */
export const HOURLY_CUTE_MESSAGES = [
  "Hey sweetie! 💕 Time for a cute water break! 💧",
  "Your little drop companion is cheering for you! Drink up! 🌸✨",
  "Glug glug! A tiny sip brings a big smile! 🥺💧",
  "Don't forget to hydrate, beautiful! 🌺💦",
  "Water break time! Your body says thank you! 🥰✨",
  "Knock knock! Hydration delivery for a special person! 📦💧",
  "A sip of water to keep your sparkle shining bright! ✨💧",
  "Sending you sweet thoughts and a cool glass of water! 💕🥛",
  "Stay hydrated, stay glowing! Your garden is growing! 🌼🌿",
  "Time for a fresh sip! Keep being amazing today! 💖💧",
  "Pop! Another water break to keep you feeling energized! 🚀💦",
  "Your tiny water drop companion misses you! Take a sip! 🥺🌸",
  "Hydration check! Grab your water bottle sweetie! 🍾✨",
  "One little sip closer to your daily goal! You got this! 💪💧",
  "Stay fresh, stay hydrated, stay lovely! 🌸💧",
  "Pure water magic for an awesome human! 🪄💦",
  "Drink water and make your little garden bloom today! 🌻✨",
  "Reminder: You deserve to feel refreshed and happy! 💕💧",
  "Glug glug! Refresh your mind and body right now! 🧠💧",
  "A gentle reminder from someone who cares: drink water! 🥰💦",
  "Hydration level loading... Take a big refreshing gulp! 🔋💧",
  "Sparkle season! Hydrate to keep that cute smile glowing! ✨💖",
  "Water break! Take 10 seconds to nourish yourself! 🍃💧",
  "Hey sleepyhead! A cool glass of water will wake you up! ☀️💦",
  "Sip sip hooray! You're doing incredible today! 🎉💧",
  "Your little koi fish in the pond are swimming happily! 🐟💦",
  "Hydration is self-love! Take a sweet sip right now! 💕🌸",
  "Keep your energy high and your stress low with water! 💧✨",
  "Friendly nudge: Go take a sip of water right now! 🥰🍾",
  "Two hydrated hearts beating together! Drink up! 💕💧"
];

let shuffledBag: string[] = [];

function getShuffledMessage(): string {
  if (shuffledBag.length === 0) {
    shuffledBag = [...HOURLY_CUTE_MESSAGES];
    for (let i = shuffledBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBag[i], shuffledBag[j]] = [shuffledBag[j], shuffledBag[i]];
    }
  }
  return shuffledBag.pop() || HOURLY_CUTE_MESSAGES[0];
}

export function getRandomMotivationalMessage(): string {
  return getShuffledMessage();
}

/**
 * Returns exact emotion messages matching character progression rules
 */
export function getEmotionMessage(emotion: string, name: string, justDrank = false): string {
  if (justDrank) {
    const happyRefreshed = [
      `Aww, thank you for the water, ${name}! So refreshing! 🥰💧`,
      `Mmm! Delicious water! Thank you ${name}! 🌸✨`,
      `Gulp gulp! I feel so much happier now! 💕💦`,
      `Yay! Pure hydration bliss! You're the best, ${name}! ✨💧`,
    ];
    return happyRefreshed[Math.floor(Math.random() * happyRefreshed.length)];
  }

  switch (emotion) {
    case 'sleepy':
      return "Hmmm... I need some water 💤";
    case 'tired':
      return "A little water, please? 🥺";
    case 'okay':
      return "Ooooh! That's better! 💧";
    case 'better':
      return "I'm feeling better! 🌸";
    case 'happy':
      return "We're halfway there! 🌼";
    case 'excited':
      return "We're doing SO good! 🌿✨";
    case 'almost_there':
      return "So close! 🚀";
    case 'super_happy':
      return `WE DID IT, ${name.toUpperCase()}!!! 🎉✨`;
    case 'proud':
      return "Goal crushed today! You're glowing! 👑✨";
    default:
      return "Stay hydrated, stay happy! 💕";
  }
}
