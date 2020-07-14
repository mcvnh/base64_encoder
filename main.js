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
  this.$el.innerHTML = this.template(this);

  var self = this;
  this.$el.querySelector('input').onchange = function (event) {
    var onChange = self.methods.onChange.bind(self);
    onChange(event);
  }
}

var app = new Rue({
  selector: '#app',

  data: {
    output: '',
  },

  template: function ({ data }) {
    return `
      <h1>
        Base64 Image Encoder
      </h1>
      <div>
        <input style="z-index: 999; opacity: 0; width: 320px; height: 200px; position: absolute; right: 0px; left: 0px; margin-right: auto; margin-left: auto;" name="file" id="filer_input2" type="file">
        <div class="drag-drop-area"><div class="input-inner"><div class="input-icon"><i class="fa fa-file-image-o"></i></div><div class="input-text"><h3>Drag and drop file here</h3> <span style="display:inline-block; margin: 15px 0">or</span></div><a class="input-choose-btn blue">Browse file</a></div></div>
      </div>

      <div class="base64-output">
        ${data.output}
      </div>
    `;
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
  },
});

app.render();
