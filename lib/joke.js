// lib/joke.js
module.exports = async (sock, jid) => {
  const jokes = [
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "I'm reading a book on anti-gravity. It's impossible to put down!",
    "Why don't eggs tell jokes? They'd crack each other up."
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];

  const buttons = [
    { buttonId: 'joke_more', buttonText: { displayText: 'More Jokes' }, type: 1 },
    { buttonId: 'menu', buttonText: { displayText: 'Menu' }, type: 1 }
  ];

  await sock.sendMessage(jid, { text: joke, buttons });
};
