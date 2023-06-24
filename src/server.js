const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const axios = require('axios');
const cors = require("cors");
require("dotenv").config();

const textGeneration = async (prompt) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/completions';
    const response = await axios.post(apiUrl, {
      model: "text-davinci-003",
      prompt: `${prompt}`,
      max_tokens: 500,
      temperature: 0.9
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return {
      status: 1,
      response: `${response.data.choices[0].text}`,
    };
  } catch (error) {
    console.log('Erro: '+error);
    return {
      status: 0,
      response: '',
    }
  }
};

const webApp = express();

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());
webApp.use((req, res, next) => {
  console.log(`Path ${req.path} with Method ${req.method}`);
  next();
});

webApp.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
webApp.use(express.static(__dirname));

webApp.get("/chat", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

webApp.get("/", (req, res) => {
  res.sendStatus(200);
});

webApp.post("/dialogflow", async (req, res) => {
  let action = req.body.fulfillmentInfo.tag;
  let queryText = req.body.text;
  

  if (action === "input.unknown") {
    let result = await textGeneration(queryText);
    console.log(result);
    if (result.status == 1) {
      res.send({
        fulfillmentText: result.response,
      });
    } else {
      res.send({
        fulfillmentText: `Desculpe, Eu não posso te ajudar no momento.`,
      });
    }
  } else {
    res.send({
      fulfillmentText: `Nenhum manipulador para a ação ${action}.`,
    });
  }
});

const listener = webApp.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
