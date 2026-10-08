'use strict';

// Chat thread: send messages and offers via the API without a full page reload.
(function () {
  var messagesEl = document.getElementById('messages');
  if (!messagesEl) return;
  if (!window.CS) return;

  var chatId = messagesEl.getAttribute('data-chat-id');
  var userId = messagesEl.getAttribute('data-user-id');
  var offerForm = document.getElementById('offerForm');
  var messageForm = document.getElementById('messageForm');

  var known = {};

  function bubble(m) {
    var mine = userId && m.senderId === userId;
    var el;
    if (m.type === 'offer') {
      el = document.createElement('div');
      el.className = 'bubble offer ' + (mine ? 'buyer' : 'seller');
      el.textContent = '\uD83D\uDCB0 Offer: ' + CS.money(m.amount);
    } else {
      el = document.createElement('div');
      el.className = 'bubble ' + (mine ? 'buyer' : 'seller');
      el.textContent = m.text;
    }
    return el;
  }

  function renderAll(messages) {
    var empty = messagesEl.querySelector('.chat-empty');
    if (empty) empty.remove();
    messages.forEach(function (m) {
      if (known[m.id]) return;
      known[m.id] = true;
      messagesEl.appendChild(bubble(m));
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function poll() {
    try {
      var data = await CS.api(
        '/api/v1/chats/' + encodeURIComponent(chatId) + '/messages'
      );
      renderAll(data.messages || []);
    } catch (_) {
      /* ignore transient polling errors */
    }
  }

  async function send(body) {
    try {
      var data = await CS.api(
        '/api/v1/chats/' + encodeURIComponent(chatId) + '/messages',
        { method: 'POST', body: body }
      );
      if (data.message) {
        known[data.message.id] = true;
        messagesEl.appendChild(bubble(data.message));
        var empty = messagesEl.querySelector('.chat-empty');
        if (empty) empty.remove();
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      // Poll a couple of times so the auto-reply appears smoothly.
      setTimeout(poll, 900);
      setTimeout(poll, 1900);
    } catch (err) {
      CS.toast(err.message || 'Could not send message');
    }
  }

  if (offerForm) {
    offerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('offerInput');
      var amount = Number(input.value);
      if (!amount) return;
      input.value = '';
      send({ amount: amount });
    });
  }

  if (messageForm) {
    messageForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('messageInput');
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      send({ text: text });
    });
  }

  poll();
  setInterval(poll, 4000);
})();
