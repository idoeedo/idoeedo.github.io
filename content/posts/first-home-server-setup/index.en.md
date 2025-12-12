+++
date = '2025-11-24T11:58:30+09:00'
draft = false
title = 'My First Ubuntu Home Server Build Log'
tags = ['Home Server', 'Ubuntu']
translationKey = 'first-home-server-setup'
+++



This post documents the process of setting up my very first home server. I’ve summarized how I installed **Ubuntu Server LTS** on a Mini PC and configured the **basic operations and security settings**. If you are building a home server for the first time, please take this as a light reference on "how this person set things up."

If you have any questions or see anything that needs correction, please feel free to leave a comment. Let's get started!

--------------------------------------------------------------------------------

## 1 Hardware Selection

After considering what equipment to use for the server, I chose a **Mini PC** for the following reasons:

- **Power Efficiency**: It consumes less power compared to a desktop, so leaving it on 24/7 is less of a burden on the electricity bill.
- **Space Efficiency**: Its small size allows it to be placed anywhere.
- **Performance & Scalability**: It performs better than a Raspberry Pi, and it is easy to replace RAM or SSDs if needed.

--------------------------------------------------------------------------------

## 2 Linux Installation

I connected a monitor and keyboard to the Mini PC and installed the operating system. I chose [**Ubuntu Server LTS**](https://ubuntu.com/download/server) because it is popular and has extensive reference materials available.

{{< note emoji="" title="Tip">}}

During the installation process, when the option `Install OpenSSH server` appears, make sure to check it.

{{< /note >}}

--------------------------------------------------------------------------------

## 3 Basic System Settings

A freshly installed server is merely in a state of "just up and running." To make server operation and management convenient and secure, I proceeded with a few basic configurations.

--------------------------------------------------------------------------------

### 3.1 Package Updates

There may have been package and kernel updates between the time the ISO image was created and the current time. For security, the first thing I did was update everything to the latest state.

```sh
sudo apt update
sudo apt full-upgrade -y
```

Since a kernel update might have been included, I rebooted the system.

```sh
sudo reboot 
```

--------------------------------------------------------------------------------

### 3.2 Switching to `zsh`

The default shell is `bash`, but I wanted to comfortably use plugins for auto-completion and syntax highlighting, so I switched the default shell to `zsh`.

```sh
# Install zsh
sudo apt install zsh -y

# Verify installation
which zsh

# Change shell
chsh -s $(which zsh)
```

Now, if you disconnect your SSH session and log in again (or reboot the server), `zsh` will appear as the default shell.

Applying [Oh My Zsh](https://ohmyz.sh/) or [Powerlevel10k](https://github.com/romkatv/powerlevel10k) makes the terminal prettier and more convenient, but this post will only cover "changing the default shell to `zsh`."

--------------------------------------------------------------------------------

### 3.3 Timezone Setting

It is much more convenient when viewing logs if the server time matches the time I am actually active. Therefore, I changed the server's timezone to Korea Standard Time (`Asia/Seoul`).

```sh
# Check current timezone
timedatectl status

# Set timezone
sudo timedatectl set-timezone Asia/Seoul

# Verify change
timedatectl status
```

--------------------------------------------------------------------------------

### 3.4 Swap Configuration

My Mini PC does not have abundant RAM. If I run heavy tasks and memory runs out, Linux might forcibly kill processes. To prevent this, I checked the **Swap** settings.

Simply put, Swap is "**spare memory borrowed from the disk when RAM is insufficient.**"

#### [ 3.4.1 Check Swap Status ]

First, I checked the current memory and Swap status.

```sh
# Check memory and swap usage
free -h

# Check active swap
swapon --show

# Check auto-mount setting on reboot
grep swap /etc/fstab
```

The latest Ubuntu Server automatically creates a `/swap.img` file during installation. Upon checking, my server already had a Swap file created and registered in `fstab`, so I decided to use it as is.

#### [ 3.4.2 Adjusting Swappiness ]

The value that determines how aggressively Swap is used is `vm.swappiness`. The default value of `60` uses Swap quite frequently. To protect SSD lifespan and maintain performance, I lowered the value to `10`, meaning "**use RAM as much as possible, and use Swap only when absolutely necessary.**"

```sh
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf

# Apply settings
sudo sysctl -p /etc/sysctl.d/99-swappiness.conf

# Verify settings
cat /proc/sys/vm/swappiness
```

--------------------------------------------------------------------------------

### 3.5 Auto Security Updates

Since I might not check the home server every day, I configured `unattended-upgrades` so that security patches are installed automatically.

#### [ 3.5.1 Installation & Activation ]

```sh
# Install package
sudo apt install unattended-upgrades -y

# Enable feature (Select 'Yes')
sudo dpkg-reconfigure unattended-upgrades
```

#### [ 3.5.2 Auto-Remove Unused Dependencies ]

To prevent old kernels or unused libraries from piling up during updates, I enabled the auto-remove option, `Remove-Unused-Dependencies`.

```sh
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

```sh
# Remove the comment (`//`) and change to `"true"`
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

#### [ 3.5.3 Adding Reboot Notification ]

There are cases where a reboot is required after a security patch. I dislike the server rebooting on its own, so instead of enabling the auto-reboot option, I added a script to `.zshrc` to display a notification upon SSH login.

```sh
nano ~/.zshrc
```

I pasted the following content at the bottom of the file.

```sh
RED="$(tput setaf 1)"
RESET="$(tput sgr0)"

if [ -f /var/run/reboot-required ]; then
  echo
  echo "${RED}############################################"
  echo " ⚠️  SYSTEM REBOOT REQUIRED!"
  echo
  echo " - Details: cat /var/run/reboot-required"
  echo " - Reboot: sudo reboot"
  echo "############################################${RESET}"
  echo
fi
```

--------------------------------------------------------------------------------

## 4 Accessing from Inside the House

I disconnected the monitor and keyboard from the Mini PC and configured it for remote access.

--------------------------------------------------------------------------------

### 4.1 SSH Connection Prep

#### [ 4.1.1 Check SSH Daemon Status ]

Since I installed SSH during the Ubuntu Server installation process, I checked if SSH was running properly.

```sh
sudo systemctl status ssh
```

#### [ 4.1.2 Check Server IP ]

I checked the currently assigned IP address (in the format `192.168.x.x`) on the server with the following command:

```sh
hostname -I
```

#### [ 4.1.3 First SSH Connection ]

I attempted to connect from a laptop connected to the same router.

```sh
ssh -p 22 {username}@192.168.x.x
```

If the connection is successful, you can now remove the monitor and keyboard from the Mini PC. All subsequent work was done comfortably via SSH from the laptop.

--------------------------------------------------------------------------------

### 4.2 Enabling UFW

I enabled Ubuntu's default firewall, **UFW (Uncomplicated Firewall)**.

{{< note emoji="⚠️" title="Warning">}}

If you enable the firewall without opening the SSH port, the connection will drop, and you will have to reconnect the monitor and keyboard. You must follow the order below.

{{< /note >}}

```sh
# Allow default SSH port (22)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

{{< note emoji="" title="UFW and Docker Conflict Issue">}}

Later, when installing Docker, you need to be aware of the "**UFW and Docker conflict issue.**" This is a common security issue; simply put, "even if a user opens only specific ports with UFW, running a Docker container might expose other ports to the outside."

Please refer to solutions such as binding ports only to localhost (`127.0.0.1`) or using tools like `ufw-docker`.

{{< /note >}}

--------------------------------------------------------------------------------

### 4.3 Changing SSH Port

The default port `22` is the path most frequently attacked by automated hacker bots. Just changing the port number significantly reduces Brute Force attack logs. As an example, I changed it to port `2222`.

#### [ 4.3.1 Allow New Port ]

Before changing the settings, I opened the firewall first. Otherwise, I could be locked out immediately after restarting the service.

```sh
sudo ufw allow 2222/tcp
```

#### [ 4.3.2 Edit Configuration ]

I backed up the configuration file just in case, and then edited the file.

```sh
# Backup original config file
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Edit config file
sudo nano /etc/ssh/sshd_config
```

I found the part written as `#Port 22`, removed the comment (`#`), and changed the number.

```sh
Port 2222
```

In Ubuntu, `/etc/ssh/sshd_config.d/*.conf` files can override the main configuration. I checked if any other files were defining the port number. If another file has a port number setting, you must change it there as well.

```sh
sudo grep -R "Port" /etc/ssh/sshd_config.d/
```

#### [ 4.3.3 Restart & Test ]

{{< note emoji="⚠️" title="Warning">}}

Do not close the current terminal window. If the configuration gets messed up and you cannot connect, the currently connected session is your lifeline. You must keep the current window open until you verify connection in a new terminal window.

{{< /note >}}

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

Without closing the current terminal, I opened a new terminal and attempted to connect via the new port.

```sh
ssh -p 2222 {username}@192.168.x.x
```

I confirmed that the connection works normally in the new terminal.

#### [ 4.3.4 Close Default Port ]

I deleted the unused port 22 rule from the firewall.

```sh
sudo ufw delete allow OpenSSH

# Check status
sudo ufw status
```

Now, SSH only accepts connections on port `2222`.

--------------------------------------------------------------------------------

### 4.4 Setting up SSH Key Login

For security, I disabled password entry and configured it so that **only devices with a registered SSH Key File can connect.**

#### [ 4.4.1 Generate and Transfer Key Pair ]

I performed this step on the **laptop (Client) I wanted to connect from**, not the server.

```sh
ssh-keygen -t ed25519 -C "homeserver"
```

I transferred the generated public key from the laptop to the server.

```sh
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 {username}@192.168.x.x
```

I checked if I could connect without a password.

```sh
ssh -p 2222 {username}@192.168.x.x
```

If logged in successfully, the laptop can now access the server using the SSH key.

#### [ 4.4.2 Block Password Login ]

After confirming that key login works well, I turned off password login.

In the configuration file, I removed the comment (`#`) from the `PasswordAuthentication` option and changed it to `no`.

```sh
sudo nano /etc/ssh/sshd_config
```

```sh
PasswordAuthentication no
```

As with the port number setting, I checked if `/etc/ssh/sshd_config.d/*.conf` files were overriding this setting. (Actually, the same option was defined in another file, so I opened that file and changed it to `no` as well.)

```sh
sudo grep -R "PasswordAuthentication" /etc/ssh/sshd_config.d/
```

Since the settings were changed, I restarted SSH.

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

--------------------------------------------------------------------------------

### 4.5 Disable Root Login

Next, I blocked **direct login with the root account**.

In the configuration file, I removed the comment (`#`) from the `PermitRootLogin` option and changed it to `no`.

```sh
sudo nano /etc/ssh/sshd_config
```

```sh
PermitRootLogin no
```

I checked if any config files were overriding this setting.

```sh
sudo grep -R "PermitRootLogin" /etc/ssh/sshd_config.d/
```

Since the settings were changed, I restarted SSH.

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

--------------------------------------------------------------------------------

### 4.6 Fail2Ban Configuration

Even with these settings, someone who figures out the port can continuously attempt SSH connections. Since password login is disabled, it won't be easily breached, but the logs can be flooded with failure logs.

So, I installed [**Fail2Ban**](https://github.com/fail2ban/fail2ban) to block IPs that fail a certain number of times for a certain period.

#### [ 4.6.1 Installation ]

```sh
# Install Fail2Ban
sudo apt install fail2ban -y

# Check installation
systemctl status fail2ban
```

#### [ 4.6.2 Create Configuration File ]

Since the default configuration file (`/etc/fail2ban/jail.conf`) might be overwritten during package updates, I created `/etc/fail2ban/jail.local` to override the default settings.

```sh
sudo nano /etc/fail2ban/jail.local
```

I configured it as follows. For `port`, I entered the SSH port number I changed earlier (e.g., `2222`).

```toml
[DEFAULT]

# (e.g., 5 failures in 10 minutes -> 1 hour ban)
bantime = 1h 
findtime = 10m 
maxretry = 5  

# Prevent blocking my IP (Localhost)
ignoreip = 127.0.0.1/8

# Since using UFW, set ban action to ufw
banaction = ufw

# Log location
logtarget = /var/log/fail2ban.log


[sshd]

enabled = true
port = 2222
backend = systemd
```

#### [ 4.6.3 Apply Settings ]

```sh
# Auto-start on boot
sudo systemctl enable fail2ban

# Apply settings
sudo systemctl restart fail2ban

# Check status
sudo systemctl status fail2ban
```

--------------------------------------------------------------------------------

## 5 Accessing from Outside

The server configured in Chapter 4 was a "server that can only be used inside the house." Chapter 5 covers how to configure the server so that it can be safely accessed from outside the house.

It is possible to expose the server directly to the internet by opening port forwarding on the router. However, I wanted to create one more safety net in the middle, so I decided to use [**Tailscale**](https://tailscale.com/).

My goal is to learn server operations from the ground up, so I chose the "**SSH Server + Tailscale Network**" combination. For those who prioritize convenience, using the "**Tailscale SSH**" feature provided by Tailscale is also an option.

--------------------------------------------------------------------------------

### 5.1 Using Tailscale

#### [ 5.1.1 Install & Register ]

I installed Tailscale on the home server.

```sh
# Run installation script
curl -fsSL https://tailscale.com/install.sh | sh

# Start service (Login with the displayed auth URL)
sudo tailscale up
```

Running `sudo tailscale up` displays an authentication URL in the terminal. Opening this URL in a browser and logging in registers the home server to my Tailscale network.

Afterwards, I installed and logged into Tailscale on my laptop as well, and checked the Tailscale IP (`100.x.x.x`) of each device on the Tailscale dashboard.

#### [ 5.1.2 SSH Connection Test ]

I tested the SSH connection from the laptop to the home server's Tailscale IP. The port number is `2222`, which I changed earlier.

```sh
ssh -p 2222 {username}@{Tailscale_IP}
```

Thanks to Tailscale, I can now access the home server directly from outside without router port forwarding.

#### [ 5.1.3 Key Expiry Setting ]

Tailscale is set up so that each device's key expires every 180 days by default.

Thinking "It would be troublesome if the server suddenly disappeared from Tailscale," I accessed the Tailscale web dashboard and enabled the **Machines tab → Server right-side menu (...) → Disable key expiry option.**

Conversely, I left the laptop's key expiry as is.

--------------------------------------------------------------------------------

### 5.2 UFW Settings

I adjusted the firewall to accept SSH only from **Tailscale + Home LAN**, not the entire internet. This way, even if a port scan is performed on the home server's public IP from the outside, the SSH port appears closed.

However, there are downsides, so I recommend choosing according to your environment.

- Cons:
  - If Tailscale goes down externally, there is no way to access the server.
  - If there is an issue with the Tailscale account or key externally, there is no way to access the server.
  - If the Wi-Fi used externally blocks Tailscale traffic, there is no way to access the server.

#### [ 5.2.1 Allow Tailscale ]

I specifically allowed only traffic coming through Tailscale. Usually, the Tailscale interface name is `tailscale0`.

As before, I assume the SSH port is `2222`. (In reality, you must use the port you are using.)

```sh
# Check interface name (usually tailscale0)
ip link show
```

```sh
sudo ufw allow in on tailscale0 to any port 2222 proto tcp

# Check status
sudo ufw status
```

#### [ 5.2.2 Allow Home LAN ]

I configured it so that other devices inside the house (without Tailscale) can also connect.

First, I checked the server's IP range.

```sh
ip a
```

In the output `inet 192.168.0.50/24 ...`, `/24` means that devices with the same first three blocks (`192.168.0`) are viewed as one group. So, for the UFW rule, you can enter `192.168.0.0/24` representing the entire range.

```sh
sudo ufw allow from 192.168.0.0/24 to any port 2222 proto tcp

# Check status
sudo ufw status
```

#### [ 5.2.3 Remove Global Port Allow ]

inally, I removed the previously added "Allow port `2222` from everywhere" rule.

```sh
sudo ufw delete allow 2222/tcp

# Check status
sudo ufw status
```
