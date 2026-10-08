'use strict';

// Listing detail page enhancement: confirm before marking your own listing sold
// via the manage buttons is handled server-side on the profile page. Here we
// simply keep the "watch" action from being double-submitted.
(function () {
  var forms = document.querySelectorAll('form[action$="/watch"]');
  forms.forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Watching...';
      }
    });
  });
})();
