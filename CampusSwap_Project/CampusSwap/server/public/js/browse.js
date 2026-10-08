'use strict';

// Small progressive enhancement for the browse page. The page works fully
// without JavaScript; this just focuses the search box when arrived via ?focus.
(function () {
  var input = document.getElementById('searchInput');
  if (!input) return;
  if (new URLSearchParams(window.location.search).has('focus')) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
})();
