const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const moment = require('moment');
const { fetch } = require('undici'); // Use undici instead of node-fetch

// Directly input your tokens here (not recommended for production)
const TOKEN = 'MTI5NTAxMzQ5NDgzMTQ0ODE0Ng.G3o_RV.0aDBln1WD2HFi8CVBhY-dAtPBVpgLUBYV2GuI8'; // Replace with your Discord bot token
const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID'; // Replace with your Discord client ID
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your OpenWeather API key

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Define slash commands
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'weather',
    description: 'Get the weather for a specific city',
    options: [
      {
        name: 'city',
        type: 3, // STRING
        description: 'The city to get weather for',
        required: true,
      },
    ],
  },
  {
    name: 'remindme',
    description: 'Set a reminder',
    options: [
      {
        name: 'time',
        type: 3, // STRING
        description: 'When to remind (e.g. 10m, 1h)',
        required: true,
      },
      {
        name: 'reminder',
        type: 3, // STRING
        description: 'The reminder text',
        required: true,
      },
    ],
  },
  {
    name: 'addrole',
    description: 'Assign a role to a user',
    options: [
      {
        name: 'user',
        type: 6, // USER
        description: 'The user to assign the role to',
        required: true,
      },
      {
        name: 'role',
        type: 8, // ROLE
        description: 'The role to assign',
        required: true,
      },
    ],
  },
  {
    name: 'removerole',
    description: 'Remove a role from a user',
    options: [
      {
        name: 'user',
        type: 6, // USER
        description: 'The user to remove the role from',
        required: true,
      },
      {
        name: 'role',
        type: 8, // ROLE
        description: 'The role to remove',
        required: true,
      },
    ],
  },
  {
    name: 'poll',
    description: 'Create a poll',
    options: [
      {
        name: 'question',
        type: 3, // STRING
        description: 'The question for the poll',
        required: true,
      },
      {
        name: 'option1',
        type: 3, // STRING
        description: 'First option',
        required: true,
      },
      {
        name: 'option2',
        type: 3, // STRING
        description: 'Second option',
        required: true,
      },
    ],
  },
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

// Weather command function with error handling
async function getWeather(city) {
  try {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return `Error: ${data.message}`;
    }

    return `The weather in ${city}: ${data.weather[0].description}, temperature: ${data.main.temp}°C, humidity: ${data.main.humidity}%`;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return 'Error fetching weather data.';
  }
}

// Remind me command function
function setReminder(time, reminder, channel) {
  const duration = moment.duration(time);
  setTimeout(() => {
    channel.send(`Reminder: ${reminder}`);
  }, duration.asMilliseconds());
}

// Event listener for bot commands with logging
client.on('interactionCreate', async interaction => {
  console.log('Interaction received:', interaction.commandName);

  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'weather') {
    const city = options.getString('city');
    const weather = await getWeather(city);
    await interaction.reply(weather);
  } else if (commandName === 'remindme') {
    const time = options.getString('time');
    const reminder = options.getString('reminder');
    setReminder(time, reminder, interaction.channel);
    await interaction.reply(`Okay! I'll remind you in ${time}.`);
  } else if (commandName === 'addrole') {
    const user = options.getUser('user');
    const role = options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);
    await member.roles.add(role);
    await interaction.reply(`Added ${role.name} to ${user.tag}.`);
  } else if (commandName === 'removerole') {
    const user = options.getUser('user');
    const role = options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);
    await member.roles.remove(role);
    await interaction.reply(`Removed ${role.name} from ${user.tag}.`);
  } else if (commandName === 'poll') {
    const question = options.getString('question');
    const option1 = options.getString('option1');
    const option2 = options.getString('option2');
    const pollMessage = await interaction.reply({
      content: `**${question}**\n1️⃣ ${option1}\n2️⃣ ${option2}`,
      fetchReply: true,
    });
    await pollMessage.react('1️⃣');
    await pollMessage.react('2️⃣');
  }
});

// Login the bot
client.login(TOKEN);

// Call the function to register the commands
registerCommands();

