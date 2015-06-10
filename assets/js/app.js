var vm = new Vue({
    
    el: "#app",

    ready: function() {
        this.pmLog('Initialized Client');
        this.channel_token = this.token;
        // this.connect();
    },

    data: {
        conn: null,
        host: 'live.pushman.dfl.mn',
        port: '8080',
        connected: false,
        token: '',
        userdata: '',
        logs: '',
        event_name: 'public',
        channel: 'public',
        channel_token: '',
        subscriptions: [],
        subscribed: false,
        lastPayload: '',
    },

    computed: {
        subscribed: function() {
            if(this.subscriptions.length >= 1) {
                return true;
            }
            return false;
        },
        juicyPayload: function()
        {
            if(this.lastPayload != '') {
                return true;
            }
            return false;
        }
    },

    methods: {
        connect: function() {
            var self = this;
            self.conn = new ab.Session('ws://' + this.host + ':' + this.port + '?token=' + this.token + '&' + this.userdata,
                // On connect
                function() {
                    self.pmLog('Connected to Host');
                    self.connected = true;
                },
                // On disconnect
                function() {
                    self.pmLog('Disconnected from Host');
                    self.connected = false;
                },
                {'skipSubprotocolCheck': true}
            );
        },

        disconnect: function()
        {
            var self = this;
            if(self.connected) {
                self.conn.close();
                self.connected = false;
                self.subscriptions = [];
            }
        },

        addSubscription: function(event) {
            event.preventDefault();
            var self = this;

            if(!self.connected) {
                return false;
            }

            if(self.event_name == '') {
                return false;
            }

            if(self.channel == '') {
                return false;
            }

            if(self.channel_token == '') {
                self.channel_token = self.token;
            }

            var new_event_name = self.updateEventName(self.channel, self.channel_token, self.event_name);

            self.subscriptions.push({
                channel: self.channel,
                event_name: self.event_name,
                token: self.channel_token,
                fqen: new_event_name,
            });

            self.conn.subscribe(new_event_name, function(topic, data) {
                var subscriptions = self.subscriptions;
                var item = {};

                for(var i = 0, len = subscriptions.length; i < len; i++) {
                    if(subscriptions[i].fqen === topic) {
                        item = subscriptions[i];
                    }
                }

                self.pmLog('Caught event `' + item.event_name + '` on `' + item.channel + '`');
                self.lastPayload = data;
            });

            self.pmLog('Subscribed to `' + self.event_name + '` on `' + self.channel + '`');

            self.event_name = '';
        },

        removeSubscription: function(subscription) {
            var self = this;
            var new_event_name = self.updateEventName(subscription.channel, subscription.token, subscription.event_name);
            self.conn.unsubscribe(new_event_name);
            self.pmLog('Unsubscribed from `' + subscription.event_name + '`');
            self.subscriptions.$remove(subscription);
        },

        updateEventName: function(channel, token, name) {
            var new_event_name = '';
            if(channel == 'public') {
                new_event_name = name;
            } else {
                new_event_name = channel + '(' + token + ')|' + name;
            }

            return new_event_name;
        },

        pmLog: function(data) {
            var STR_PAD_LEFT = 1;
            var STR_PAD_RIGHT = 2;
            var STR_PAD_BOTH = 3;

            var self = this;

            var d = new Date();
            var time = self.pad(d.getHours().toString(),2,0,STR_PAD_LEFT) + ":" + self.pad(d.getMinutes().toString(),2,0,STR_PAD_LEFT) + ":" + self.pad(d.getSeconds().toString(),2,0,STR_PAD_LEFT);
            var text = time + " - " + data;

            console.log(text);
            text = text + "<br>";
            self.logs = text.concat(self.logs);
        },

        pad: function(str, len, pad, dir) {
            var STR_PAD_LEFT = 1;
            var STR_PAD_RIGHT = 2;
            var STR_PAD_BOTH = 3;

            if (typeof(len) == "undefined") { var len = 0; }
            if (typeof(pad) == "undefined") { var pad = '0'; }
            if (typeof(dir) == "undefined") { var dir = STR_PAD_RIGHT; }

            if (len + 1 >= str.length) {
                switch (dir){
                    case STR_PAD_LEFT:
                        str = Array(len + 1 - str.length).join(pad) + str;
                    break;

                    case STR_PAD_BOTH:
                        var right = Math.ceil((padlen = len - str.length) / 2);
                        var left = padlen - right;
                        str = Array(left+1).join(pad) + str + Array(right+1).join(pad);
                    break;

                    default:
                        str = str + Array(len + 1 - str.length).join(pad);
                    break;
                }
            }
            return str;
        }

    }

});