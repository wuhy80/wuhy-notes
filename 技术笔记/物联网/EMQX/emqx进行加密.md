---
🌻日期🌻: 2024-06-06
🌙星期🌙: 星期四
⌚️时间⌚️: 16:13:14
tags:
  - emqx
---
Yes, it is possible to configure EMQX (Erlang MQTT Broker) to use SSL for publishing data while allowing subscriptions through non-SSL connections. You can achieve this by setting up different listeners in EMQX for SSL and non-SSL connections and then using firewall rules to restrict access to the non-SSL port to internal network addresses only.

Here’s a step-by-step guide on how to set this up:

### 1. Configure EMQX Listeners

**Edit the EMQX configuration file** to set up both SSL and non-SSL listeners.

#### EMQX Configuration for SSL and Non-SSL Listeners

Open the EMQX configuration file (typically located at `/etc/emqx/emqx.conf` or `/etc/emqx/emqx_dashboard.conf`) and add the following configurations:

```ini
## Listeners for SSL
listener.ssl.external = 8883
listener.ssl.external.keyfile = /path/to/your/server.key
listener.ssl.external.certfile = /path/to/your/server.crt
listener.ssl.external.cacertfile = /path/to/your/ca.crt

## Listeners for non-SSL
listener.tcp.internal = 1883
```

Replace `/path/to/your/server.key`, `/path/to/your/server.crt`, and `/path/to/your/ca.crt` with the actual paths to your SSL certificate files.

### 2. Configure Firewall Rules

**Set up firewall rules** to restrict access to the non-SSL port (1883) so that only internal IP addresses can connect to it.

#### Example Firewall Rules

For **iptables**, you can use the following commands to allow access to port 1883 only from internal IP addresses (e.g., `192.168.1.0/24`):

```bash
# Allow internal network to access port 1883
sudo iptables -A INPUT -p tcp --dport 1883 -s 192.168.1.0/24 -j ACCEPT

# Drop external access to port 1883
sudo iptables -A INPUT -p tcp --dport 1883 -j DROP
```

For **UFW (Uncomplicated Firewall)** on Ubuntu, you can configure the rules as follows:

```bash
# Allow access to port 1883 from the internal network
sudo ufw allow from 192.168.1.0/24 to any port 1883

# Deny access to port 1883 from everywhere else
sudo ufw deny 1883
```

### 3. Restart EMQX

After updating the configuration and setting up the firewall rules, restart the EMQX service to apply the changes:

```bash
sudo systemctl restart emqx
```

### 4. Publish and Subscribe Configuration

Now you can configure your clients to use the appropriate connection settings:

- **Publish with SSL**: Configure the MQTT clients that publish messages to connect to the SSL listener on port 8883.
- **Subscribe with non-SSL**: Configure the MQTT clients that subscribe to messages to connect to the non-SSL listener on port 1883 (restricted to internal network).

### Example Client Configuration

#### MQTT Publish with SSL (Python Example using Paho MQTT)

```python
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.tls_set(ca_certs="/path/to/ca.crt", certfile="/path/to/client.crt", keyfile="/path/to/client.key")
client.connect("your_emqx_server", 8883, 60)

client.publish("test/topic", "Hello SSL")
client.loop_forever()
```

#### MQTT Subscribe with non-SSL (Python Example using Paho MQTT)

```python
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("your_emqx_server", 1883, 60)

def on_message(client, userdata, msg):
    print(f"{msg.topic} {msg.payload}")

client.on_message = on_message
client.subscribe("test/topic")
client.loop_forever()
```

### Conclusion

By setting up different listeners for SSL and non-SSL connections and configuring firewall rules to restrict access to the non-SSL port to internal addresses only, you can secure your EMQX broker while simplifying the development process for internal subscribers. This setup allows external publishers to securely connect over SSL while internal subscribers can use simpler, non-SSL connections.