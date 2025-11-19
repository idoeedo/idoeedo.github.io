+++
date = '2025-11-19T11:58:30+09:00'
draft = false
title = 'Building a Home Server'
tags = ['Home Server', 'Ubuntu']
translationKey = 'home-server-setup'
+++


In this post, I’ll walk you through how I used a Mini PC to **build a home server and configure the security environment for safe external access.** I hope this guide helps anyone looking to build their first home server.

If you have any questions or spot any errors, please feel free to leave a comment. Let's get started.

---

## 1. Preparing the Hardware

I considered a Raspberry Pi, a desktop tower, and a Mini PC for the physical hardware. I ultimately decided on a **Mini PC**.


#### Why I Chose a Mini PC

- **Power Efficiency:** It places a minimal burden on the electric bill, even when running 24/7.
- **Space Efficiency:** Its compact size makes it perfect for the corner of a desk or a shelf.
- **Scalability:** Unlike a Raspberry Pi, upgrading the SSD or RAM is straightforward.

---

## 2. OS Installation

For the operating system, I chose **Ubuntu**, as it has the most references among Linux distributions.

The crucial point here is to install the `Server` version, not the `Desktop` version. The GUI included in the Desktop version hogs unnecessary memory and CPU resources. To focus limited resources on server performance, I highly recommend using the CLI-based Server version.

---

## 3. Basic Environment Setup

Immediately after installing the OS, these are the essential steps required for system stability and log management.


#### Step 1. Update System Packages

Due to the time gap between the OS image release and the current date, outdated packages may exist. Run updates to apply security patches and the latest libraries.

```sh
sudo apt update && sudo apt upgrade -y
```


#### Step 2. Configure Timezone

Linux defaults to UTC time. If the server log time differs from your actual activity time, it can cause confusion when troubleshooting later. Therefore, I changed the timezone to KST (Asia/Seoul).

```sh
sudo timedatectl set-timezone Asia/Seoul
```

---

## 4. Firewall Configuration (UFW)

The moment your server connects to the internet, it is exposed to external threats. I configured **UFW (Uncomplicated Firewall)** , Ubuntu's default firewall, to set up minimum safety measures.

```sh
# 1. Allow SSH (Caution: If you skip this, you will be locked out the moment you enable the firewall!)
sudo ufw allow OpenSSH

# 2. Enable Firewall
sudo ufw enable

# 3. Check Status
sudo ufw status
```

---

## 5. Setting Up Remote Access (Tailscale)

The biggest barrier to entry for home servers is "external access." Usually, people get stuck on Port Forwarding or DDNS settings, but using [**Tailscale**](https://tailscale.com/) solves this without complex network configurations.

Tailscale is a VPN service based on the WireGuard protocol. It groups devices on different networks as if they were on the same internal network (Mesh Network). This allows you to safely access your home server from a cafe or the office.


#### Step 1. Install Tailscale on Linux Server

Enter the command below, and an authentication link will appear. Access the link and log in to complete the server registration.

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```


#### Step 2. Client Setup (Your PC)

Install the Tailscale app on the external PC (Mac/Windows/Mobile) you want to connect from and log in. Your PC and server are now connected via private IPs in the `100.x.x.x` range.


#### Step 3. Connection Test

Try connecting via the Tailscale IP from your external PC's terminal (e.g., laptop).

```sh
ssh -p 22 {username}@{Tailscale_IP}
```

---

## 6 SSH Security Hardening

Leaving the default settings (Port 22, password login) when opening a server to the outside world is a major security vulnerability. It is highly recommended to perform the following 4 tasks for "Brute Force Defense" and "Access Control."

- **Change SSH Port**: Avoid brute force bots.
- **Switch to SSH Key Auth**: Implement an encryption key method stronger than passwords.
- **Disable Password Login**: Block unauthorized login attempts.
- **Disable Root Login**: Protect system administrator privileges.

---

### 6.1 Changing the SSH Port

The default port (22) is the primary target for attack bots. Simply changing the port number can drastically reduce meaningless connection attempt logs.


#### Step 1. Pre-allow New Port in Firewall

You must open the firewall before changing the settings to prevent being disconnected. (e.g., using port 2222)

```sh
sudo ufw allow 2222/tcp
```


#### Step 2. Modify SSH Config File

```sh
sudo nano /etc/ssh/sshd_config
```

Find the `Port 22` line in the file, remove the comment (`#`), and change it to your desired port number.

```sh
#Port 22

↓↓↓

Port 2222
```


#### Step 3. Restart Service

```sh
sudo systemctl restart ssh
```


#### Step 4. 테스트

Open a new terminal window to verify the connection works. (⚠️ Never close your current terminal window first!)

```sh
ssh -p 2222 {사용자명}@{Tailscale_IP}
```


#### Step 5. Close Old Port

If the connection via the new port works well, close the existing port 22.

```sh
sudo ufw delete allow OpenSSH
```

---

### 6.2 Switching to SSH Key Authentication

Password entry methods are always at risk of being cracked. By introducing the SSH Key Pair method, you restrict access so that only devices holding the 'Private Key' can connect.


#### Step 1. Generate Key (Run on your PC)

```sh
# Generated in the default path (~/.ssh/id_ed25519)

ssh-keygen -t ed25519 -C "homeserver”
```


#### Step 2. Send Public Key to Server (Run on your PC)

Using the `ssh-copy-id` command allows you to handle public key transfer and permission settings at once.

```sh
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 {username}@{Tailscale_IP}
```

---

### 6.3 Disabling Password & Root Login

Once the key setup is complete, block 'Password Entry' and 'Direct Root Access,' which can be security holes.


#### Step 1. Modify SSH Config File

```sh
sudo nano /etc/ssh/sshd_config
```

Find `PasswordAuthentication` and `PermitRootLogin`, remove the comments (`#`), and change them to `no`.

```sh
#PasswordAuthentication yes

↓↓↓

PasswordAuthentication no
```

```sh
#PermitRootLogin prohibit-password

↓↓↓

PermitRootLogin no
```

#### Step 2. Check Include Settings

In newer versions of Ubuntu, configuration files within the `/etc/ssh/sshd_config.d/` directory may take precedence. Check if there are any overriding settings with the commands below, and modify those files if necessary.

```sh
sudo grep -R "PasswordAuthentication" /etc/ssh/sshd_config.d/
sudo grep -R "PermitRootLogin" /etc/ssh/sshd_config.d/
```

#### Step 3. Restart Service

```sh
sudo systemctl restart ssh
```
