const axios = require('axios');
axios.put('http://localhost:3000/api/chat-messages/order/order-101/messages/msg-1', { message: "edited via axios" })
    .then(res => console.log("SUCCESS:", res.data))
    .catch(err => console.log("ERROR:", err.response ? err.response.status : err.message));
