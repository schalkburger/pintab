!(function (a) {
  "use strict";
  var b = { regexes: [{ regex: "http[s]{0,1}://mail.google.com/", comment: "Gmail" }], debug: !1, "pin-open-in-new": !1, "release-to-right": !0, "pin-new-tab": !1 };
  a.DEFAULT_OPTIONS = b;
})(this),
  (function () {
    "use strict";
    jQuery(function () {
      var a = function () {
          return a.seed || (a.seed = 1), a.seed++;
        },
        b = new TemplateManager({ "rule-template": [{ regex: "rule-id", replacement: a }] }),
        c = new SettingsManager(new ChromeExtensionSettingsManager()),
        d = new UISettingsManager(b);
      c.load(d.putSettingsIntoUI),
        jQuery('[data-toggle="tooltip"]').tooltip(),
        jQuery(".js-add-template-text").click(function () {
          var a = jQuery(this),
            c = jQuery(a.data("target")),
            d = b.get(a.data("template-name")).process();
          c.append(jQuery(d));
        }),
        jQuery("#js-rule-container").on("click", ".js-remove-button", function () {
          jQuery(jQuery(this).data("target-selector")).remove();
        }),
        jQuery("#js-save-button").click(function () {
          c.save(d.getSettingsFromUI(), function () {
            c.load(function (a) {
              jQuery("#js-rule-container").empty(), d.putSettingsIntoUI(a), jQuery("#js-settings-saved-modal").modal({ keyboard: !0 });
            });
          });
        }),
        jQuery("#js-reset-button").click(function () {
          jQuery("#js-settings-confirm-reset-modal").modal({ keyboard: !0 });
        });
    });
  })();
