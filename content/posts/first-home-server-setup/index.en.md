+++
date = '2025-11-24T11:58:30+09:00'
draft = false
title = 'Setting Up My First Ubuntu Home Server'
tags = ['home server', 'ubuntu']
translationKey = 'first-home-server-setup'
+++



This post documents the process I followed to set up my very first home server. I cover how I installed **Ubuntu Server LTS** on a Mini PC and the **fundamental operation and security configurations** I applied. If you're a first-timer setting up your own home server, I hope this serves as a light reference—a simple 'this is how one person did it.'

If you have any questions or spot anything that needs correction, please let me know in the comments. 

Let's get started!

--------------------------------------------------------------------------------

## 1 Choosing the Hardware

After considering what hardware to use for the server, I decided on a **Mini PC** for the following reasons:

* **Power Efficiency**: It consumes less power than a desktop, resulting in lower electricity bills even when running 24/7.
* **Space Saving**: Its small size means it can be placed almost anywhere.
* **Performance & Scalability**: It offers better performance than a Raspberry Pi, and upgrading the RAM or SSD is easy if needed.

--------------------------------------------------------------------------------

## 2 Ubuntu Installation

I connected a monitor and keyboard to the Mini PC and installed the operating system. 

I chose [**Ubuntu Server LTS**](https://ubuntu.com/download/server) because it's widely adopted and has abundant documentation.

--------------------------------------------------------------------------------

## 3 Basic System Configuration

A freshly installed OS is barely 'functional.' I performed several basic configurations to make server operation and management easier.

--------------------------------------------------------------------------------

### 3.1 Package Update

The packages and kernel may have been updated since the ISO image was created. Therefore, the first step was to update all packages to their latest versions.

```sh
sudo apt update
sudo apt full-upgrade -y
```

Since this may include a kernel update, I performed a reboot.

```sh
sudo reboot 
```

--------------------------------------------------------------------------------

### 3.2 Switching to `zsh`

The default shell is `bash`, but I wanted to easily use plugins for features like autocompletion and syntax highlighting, so I switched the default shell to `zsh`.

```sh
# Install zsh
sudo apt install zsh -y

# Verify installation
which zsh

# Change default shell
chsh -s $(which zsh)
```

Now, if you disconnect and reconnect the SSH session or reboot the server, `zsh` will be the default shell.

Applying [Oh My Zsh](https://ohmyz.sh/) or [Powerlevel10k](https://github.com/romkatv/powerlevel10k) can make the terminal look nicer and be more convenient, but for this post, I'll stop at 'changing the default shell to `zsh`.'

--------------------------------------------------------------------------------

### 3.3 Timezone Setting

It's much more convenient to review logs if the server time aligns with my actual activity time. So, I changed the server's timezone to Korea Time (`Asia/Seoul`).

```sh
# Check current timezone
timedatectl status

# Change timezone
sudo timedatectl set-timezone Asia/Seoul

# Verify change
timedatectl status
```

--------------------------------------------------------------------------------

### 3.4 Swap Configuration

Since my Mini PC doesn't have a large amount of RAM, I was concerned that 'running heavy tasks might kill a process due to OOM (Out Of Memory).' To mitigate this, I checked the **Swap** safeguard and adjusted its settings. 

I understand Swap simply as '**reserve memory set aside on the disk for situations where RAM is running low.**'

#### [ 3.4.1 Checking Swap Status ]

First, I checked the current memory and Swap status.

```sh
# Check memory and swap usage
free -h

# Check active swap devices
swapon --show

# Check if auto-mounted
grep swap /etc/fstab
```

The latest Ubuntu Server automatically creates a `/swap.img` file during installation. My server already had a Swap file configured, so I decided to use it as is without adjusting its size.

#### [ 3.4.2 Adjusting Swappiness]

The value that controls when the system starts using Swap is `vm.swappiness`. The default value is `60`, which uses Swap quite aggressively. I wanted the server to '**use RAM as much as possible and only resort to Swap when absolutely necessary,**' so I lowered the value to `10`.

```sh
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf

# Apply setting
sudo sysctl -p /etc/sysctl.d/99-swappiness.conf

# Verify setting
cat /proc/sys/vm/swappiness
```

--------------------------------------------------------------------------------

### 3.5 Automated Security Updates

Since I might not be able to check the home server every day, I wanted to set up automatic security patch updates. I used `unattended-upgrades` for this.

#### [ 3.5.1 Installation & Activation ]

```sh
# Install the package
sudo apt install unattended-upgrades -y

# Activate the feature (select 'Yes')
sudo dpkg-reconfigure unattended-upgrades
```

#### [ 3.5.2 Option Configuration ]

I wanted to automatically clean up unnecessary packages, so I enabled the `Remove-Unused-Dependencies` option in the configuration file. This option automatically cleans up older kernel versions or libraries that are no longer needed during the update process.

```sh
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

```sh
# Remove the comment (`//`) and change to `"true"`
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

#### [ 3.5.3 Adding Reboot Notification ]

Rebooting is sometimes required after an automatic update. I didn't want the server to reboot automatically, so I chose to display a highly visible notification when logging in via SSH. 

I added a simple script to the bottom of my `.zshrc` file.

```sh
nano ~/.zshrc
```

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

Now, every time I SSH into the server, I can tell at a glance if a reboot is needed.

--------------------------------------------------------------------------------

## 4 Accessing from Within the Local Network

Now, I'll disconnect the monitor and keyboard from the Mini PC and configure it for remote access.

--------------------------------------------------------------------------------

### 4.1 Preparing the SSH Server

#### [ 4.1.1 Checking SSH Daemon Status ]

Since SSH was installed during the Ubuntu Server setup, I checked if it was running correctly.

```sh
sudo systemctl status ssh
```

#### [ 4.1.2 Checking Server LAN IP ]

To connect to the server from a laptop on the same router, I needed the server's LAN IP.

```sh
hostname -I
```

I noted down the IP address that looks like `192.168.x.x`.

#### [ 4.1.3 First SSH Connection ]

Next, I attempted to connect from my laptop, which is using the same router as the home server.

```sh
ssh -p 22 {username}@192.168.x.x
```

Since the connection worked, I removed the monitor and keyboard connected to the Mini PC. All subsequent work was done by connecting to the server via SSH from my laptop.

--------------------------------------------------------------------------------

### 4.2 Activating UFW

I enabled **UFW (Uncomplicated Firewall)**, which is Ubuntu's default firewall.

```sh
# Allow default SSH port (22)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status 
```

--------------------------------------------------------------------------------

### 4.3 Changing the SSH Port

The default SSH port, `22`, is the port most frequently knocked on by bots worldwide. If the server is exposed to the internet, logs will quickly accumulate with connection attempts. So, I changed the port from `22` to another number (e.g., `2222`).

#### [ 4.3.1 Allowing the New Port ]

First, I opened the new port on the firewall. I'll use port `2222` as an example.

```sh
sudo ufw allow 2222/tcp
```

#### [ 4.3.2 Modifying the Configuration ]

I changed the port number in the configuration file.

```sh
sudo nano /etc/ssh/sshd_config
```

```sh
#Port 22

↓↓↓

Port 2222
```

In Ubuntu, files in `/etc/ssh/sshd_config.d/*.conf` are also read, so I checked if the port number was being redefined elsewhere. If another file contained a port number setting, I had to change it to `2222` in that file as well.

```sh
sudo grep -R "Port" /etc/ssh/sshd_config.d/
```

After making the change, I restarted SSH.

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

#### [ 4.3.3 Testing Connection on the New Port ] 

Without closing the currently connected terminal, I opened a new one and tried connecting with the new port.

```sh
ssh -p 2222 {username}@192.168.x.x
```

If the connection is successful, SSH is working correctly on the new port.

#### [ 4.3.4 Closing the Default Port ]

After confirming the new port works, I deleted the rule allowing connections on port `22`.

```sh
sudo ufw delete allow OpenSSH

# Check status
sudo ufw status
```

SSH now only accepts connections on port `2222`.

--------------------------------------------------------------------------------

### 4.4 Changing SSH Login Method

For security, I opted to **allow connections only from devices with the correct SSH key** and **disable password-based login**.

#### [ 4.4.1 Generating Key Pair ]

I generated the SSH key on my laptop.

```sh
# Use Ed25519 algorithm
ssh-keygen -t ed25519 -C "homeserver"
```

I copied the generated public key to the server.

```sh
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 {username}@192.168.x.x
```

#### [ 4.4.2 Testing Key Login ]

I checked if I could connect without a password.

```sh
ssh -p 2222 {username}@192.168.x.x
```

If logged in successfully, my laptop can now access the server using only the SSH key.

#### [ 4.4.3 Blocking Password Login ]

After confirming that key login worked, I disabled password login. 

I removed the comment (`#`) from the `PasswordAuthentication` option in the configuration file and changed it to `no`.

```sh
sudo nano /etc/ssh/sshd_config
```

```sh
#PasswordAuthentication yes

↓↓↓

PasswordAuthentication no
```

Just like with the port number setting, I had to check if any file in `/etc/ssh/sshd_config.d/*.conf` was overriding this setting. (In fact, another file defined the same option, so I opened it and changed it to `no` there as well.)

```sh
sudo grep -R "PasswordAuthentication" /etc/ssh/sshd_config.d/
```

After making the change, I restarted SSH.

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

--------------------------------------------------------------------------------

### 4.5 Disabling Root Login

Next, I prevented **direct root account login**. 

I removed the comment (`#`) from the `PermitRootLogin` option in the configuration file and changed it to `no`.

```sh
sudo nano /etc/ssh/sshd_config
```

```sh
#PermitRootLogin yes

↓↓↓

PermitRootLogin no
```

I also checked if the setting was overridden in `/etc/ssh/sshd_config.d/*.conf`, just as I did with the port number setting. If another file defined the same option, I had to open it and change it to `no` there as well.

```sh
sudo grep -R "PermitRootLogin" /etc/ssh/sshd_config.d/
```

After making the change, I restarted SSH.

```sh
# Check SSH configuration syntax
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

--------------------------------------------------------------------------------

### 4.6 Fail2Ban Configuration

Even with the settings above, someone who discovers the port can still constantly attempt SSH connections. Although disabling password login makes it hard to breach, the logs could become flooded with failed attempts. 

So, I installed [**Fail2Ban**](https://github.com/fail2ban/fail2ban) to temporarily block any IP address that fails to log in after a certain number of attempts.

#### [ 4.6.1 Installation ]

```sh
# Install Fail2Ban
sudo apt install fail2ban -y

# Check installation
systemctl status fail2ban
```

#### [ 4.6.2 Creating Configuration File ]

The default configuration file (`/etc/fail2ban/jail.conf`) might be overwritten during package updates, so I created a new file, `/etc/fail2ban/jail.local`, to override the default settings.

```sh
sudo nano /etc/fail2ban/jail.local
```

I configured it as follows. For `port`, I used the SSH port number I had previously changed (e.g., `2222`).

```toml
[DEFAULT]

# (e.g., ban for 1 hour if 5 failures occur within 10 minutes)
bantime = 1h 
findtime = 10m 
maxretry = 5  

# Prevent banning my own IP (Localhost)
ignoreip = 127.0.0.1/8

# Specify ufw as the banning action since I'm using UFW
banaction = ufw

# Log storage location
logtarget = /var/log/fail2ban.log


[sshd]

enabled = true
port = 2222
backend = systemd
```

#### [ 4.6.3 Applying Settings ]

```sh
# Start automatically at boot
sudo systemctl enable fail2ban

# Apply configuration
sudo systemctl restart fail2ban

# Check status
sudo systemctl status fail2ban
```

--------------------------------------------------------------------------------

## 5 Accessing from Outside the Local Network

The server configured in Chapter 4 was only 'accessible from within the home network.' Now, I'll set it up so it can be safely accessed from outside the home. 

It's possible to expose the server directly to the internet by just enabling port forwarding on the router. However, I wanted an extra layer of security, so I decided to use [**Tailscale**](https://tailscale.com/). 

My goal is to learn server operation from the ground up, so I chose the '**SSH server + Tailscale network**' combination. For those who prioritize convenience, using the '**Tailscale SSH**' feature offered by Tailscale is also an option.

--------------------------------------------------------------------------------

### 5.1 Using Tailscale

#### [ 5.1.1 Installation & Registration ]

I installed Tailscale on the home server.

Running `sudo tailscale up` displays an authentication URL in the terminal. Opening this URL in a browser and logging in registers the home server to my Tailscale network.

```sh
# Run the installation script
curl -fsSL https://tailscale.com/install.sh | sh

# Start the service (log in with the authentication URL displayed)
sudo tailscale up
```

After installing and logging into Tailscale on my laptop, I could see the Tailscale IP (`100.x.x.x`) for each device on the Tailscale dashboard.

#### [ 5.1.2 SSH Connection Test ]

I tested the SSH connection from my laptop using the home server's Tailscale IP. The port number is `2222`, which I had changed earlier.

```sh
ssh -p 2222 {username}@{Tailscale_IP}
```

Thanks to Tailscale, I can now connect to my home server from outside the home without router port forwarding.

#### [ 5.1.3 Key Expiry Setting ]

Tailscale keys for each device are set to expire every 180 days by default. 

I was concerned that 'the server might suddenly disappear from Tailscale,' so I enabled the '**Disable key expiry**' option for the home server on the Tailscale web dashboard. 

Conversely, I'm using the laptop with key expiry still enabled.

--------------------------------------------------------------------------------

### 5.2 UFW Configuration

I adjusted the firewall to **only accept SSH connections from Tailscale and the local LAN**, not the entire internet. This makes the SSH port appear closed to outside port scans targeting the home server's public IP.

However, this has drawbacks, so I recommend choosing based on your environment.

- Drawbacks:
    - No way to access the server if Tailscale fails outside the home.
    - No way to access the server if there's an issue with the Tailscale account or key outside the home.
    - No way to access the server if the external Wi-Fi blocks Tailscale traffic.

ㅤ

As before, I'll assume the SSH port is `2222` for the example (you should use your actual port).

#### [ 5.2.1 Allowing Tailscale ]

I'll specifically allow traffic coming through Tailscale. The Tailscale interface name is typically `tailscale0`.

```sh
# Check interface name (usually tailscale0)
ip link show
```

```sh
sudo ufw allow in on tailscale0 to any port 2222 proto tcp

# Check status
sudo ufw status
```

#### [ 5.2.2 Allowing Local LAN ]

I configured it so other devices within the home can also connect (without Tailscale). 

First, I checked the server's IP range.

```sh
ip a
```

In the output, `inet 192.168.0.50/24 ...`, the `/24` means that devices with the same first three octets (`192.168.0`) are considered a single group. So, for the UFW rule, I'll enter the entire range: `192.168.0.0/24`.

```sh
sudo ufw allow from 192.168.0.0/24 to any port 2222 proto tcp

# Check status
sudo ufw status
```

#### [ 5.2.3 Removing Global Port Allowance ]

Finally, I removed the previously added rule that allowed connections to port `2222` from everywhere.

```sh
sudo ufw delete allow 2222/tcp

# Check status
sudo ufw status
```
