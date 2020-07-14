var h = function (type, props, children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);

  if (children) {
    if (typeof children == 'string') {
      dom.appendChild(document.createTextNode(children));
    } else {
      for (let child of children) {
        if (child) {
          if (typeof child != "string") {
            dom.appendChild(child);
          } else {
            dom.appendChild(document.createTextNode(child));
          }
        }
      }
    }
  }

  return dom;
}

var debounceRender = function (instance) {
  if (instance.debounce) {
    window.cancelAnimationFrame(instance.debounce); }

  instance.debounce = window.requestAnimationFrame(function () {
    instance.render();
  });
};

var handler = function (instance) {
  return {
    get: function (obj, prop) {
      if (['object Object', '[object Array]'].indexOf(Object.prototype.toString.call(obj[prop])) > -1) {
        return new Proxy(obj[prop], handler(instance));
      }
      return obj[prop];
    },

    set: function (obj, prop, value) {
      obj[prop] = value;
      debounceRender(instance);
      return true;
    },

    deleteProperty: function (obj, prop) {
      delete obj[prop];
      debounceRender(instance);
      return true;
    }
  };
};

var Rue = function (options) {
  var self = this;
  var data = new Proxy(options.data, handler(this))

  self.$el = document.querySelector(options.selector);
  self.template = options.template;
  self.debounce = null;
  self.methods = options.methods;

  Object.defineProperty(this, 'data', {
    get: function () {
      return data;
    },
    set: function (newValue) {
      data = new Proxy(newValue, handler(self));
      debounceRender(self);
      return true;
    }
  });
};

Rue.prototype.render = function () {
  this.$el.innerHTML = '';
  this.$el.appendChild(this.template(this));
}

var app = new Rue({
  selector: '#app',

  data: {
    output: '',
  },

  template: function (instance) {
    var data = instance.data;
    var methods = instance.methods;

    return h('div', null, [
      h('h1', null, 'Base64 Image Encoder'),
      h('div', null, [
        h('input', {
          style: 'z-index: 999; opacity: 0; width: 320px; height: 200px; position: absolute; right: 0px; left: 0px; margin-right: auto; margin-left: auto;',
          name: 'file',
          id: "filer_input2",
          type: 'file',
          accept: 'image/*',
          onchange: function(event) {
            methods.onChange.bind(instance)(event);
          }
        }),

        h('div', { className: 'drag-drop-area' }, [
          h('div', { className: 'input-inner' }, [

            h('div', { className: 'input-icon' }, [
              h('i', { className: 'fa fa-file-image-o' })
            ]),

            h('div', { className: 'input-text' }, [
              h('h3', null, 'Drag and drop file here'),
              h('span', { style: 'display: inline-block; margin: 15px 0' }, 'or'),
            ]),

            h('a', { className: 'input-choose-btn blue' }, 'Browse file')
          ])
        ]),

        data.output
          ? h('div', { style: 'text-align: center; margin-bottom: 10px' }, [
              h('a', {
                className: 'input-choose-btn',
                onmouseup: function() {
                  methods.copyToClipboard.bind(instance)();
                }
              }, 'Copy to Clipboard')
            ])
          : undefined,

        h('div', { className: 'base64-output' }, data.output)
      ])
    ]);
  },

  methods: {
    onChange (event) {
      var file = event.target?.files?.[0] ?? null
      var self = this;
      if (file) {
        var fileReader = new FileReader();

        fileReader.addEventListener("load", function (res) {
          self.data.output = res.target.result.split('base64,')[1];
        });

        fileReader.readAsDataURL(file);
      }
    },

    copyToClipboard () {
      var range = document.createRange();
      range.selectNode(document.querySelector('.base64-output'));
      window.getSelection().addRange(range);
      document.execCommand("copy");
    },
  },
});

app.render();
