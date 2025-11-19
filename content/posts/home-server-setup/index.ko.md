+++
date = '2025-11-19T11:58:30+09:00'
draft = false
title = '홈서버 구축기'
tags = ['홈서버', '우분투']
translationKey = 'home-server-setup'
+++


이 글에서는 미니 PC를 사용해 **홈서버를 구축하고, 외부에서 안전하게 접속할 수 있도록 보안 환경을 세팅한 과정**을 정리했습니다. 홈서버를 처음 구축하시는 분들께 도움이 되기를 바랍니다.

혹시 내용 중 궁금한 점이나 잘못된 부분이 있다면 언제든 댓글로 알려주세요. 그럼 시작하겠습니다.

---

## 1 서버용 하드웨어 준비

운영체제를 설치할 물리적 장비로 라즈베리파이, 데스크톱, 미니 PC 등을 고민하다가 최종적으로 **미니 PC**를 선택했습니다.


#### 미니 PC를 선택한 이유

- **전력 효율:** 24시간 가동해도 전기 요금 부담이 적습니다.
- **공간 활용:** 크기가 작아 책상 구석이나 선반에 두기 좋습니다.
- **확장성:** 라즈베리파이와 달리 SSD나 RAM 업그레이드가 쉽습니다.

---

## 2 OS 설치

운영체제는 리눅스 배포판 중 레퍼런스가 많은 **Ubuntu**를 선택했습니다. 

여기서 헷갈리지 않아야 하는 점은 `Desktop` 버전이 아닌 `Server` 버전을 설치해야 한다는 것입니다. Desktop 버전에 포함된 GUI는 불필요한 메모리와 CPU 리소스를 점유합니다. 한정된 자원을 서버 성능에 집중시키기 위해 CLI 기반의 Server 버전을 사용하는 것을 추천해 드립니다. 

---

## 3 기본 환경 설정

OS 설치 직후, 시스템 안정성과 로그 관리를 위해 필수적으로 선행되어야 하는 작업입니다.


#### Step 1. 시스템 패키지 업데이트

설치된 OS 이미지와 현재 시점의 차이로 인해 구버전 패키지가 존재할 수 있습니다. 보안 패치와 최신 라이브러리 적용을 위해 업데이트를 진행합니다.

```sh
sudo apt update && sudo apt upgrade -y
```


#### Step 2. 시간대 설정

리눅스의 기본 시간은 UTC입니다. 서버 로그의 시간과 내 실제 활동 시간이 다르면 추후 장애 대응 시 혼선을 빚을 수 있으므로 **KST(Asia/Seoul)** 시간대로 변경합니다.

```sh
sudo timedatectl set-timezone Asia/Seoul
```

---

## 4 방화벽 설정 (UFW)

서버가 인터넷에 연결되는 순간 외부 위협에 노출됩니다. Ubuntu의 기본 방화벽인 **UFW(Uncomplicated Firewall)** 를 설정하여 최소한의 안전장치를 마련합니다.

```sh
# 1. SSH 접속 허용 (주의: 설정하지 않으면 방화벽 켜는 순간 접속 불가!)
sudo ufw allow OpenSSH

# 2. 방화벽 활성화
sudo ufw enable

# 3. 상태 확인
sudo ufw status
```

---

## 5 원격 접속 구성 (Tailscale)

홈서버 구축의 가장 큰 진입 장벽은 '외부 접속' 문제입니다. 보통 포트포워딩이나 DDNS 설정에서 막히곤 하는데, [**Tailscale**](https://tailscale.com/)을 사용하면 복잡한 네트워크 설정 없이 해결됩니다.

Tailscale은 WireGuard 프로토콜 기반의 VPN 서비스로, 서로 다른 네트워크에 있는 기기들을 마치 같은 내부망(Mesh Network)에 있는 것처럼 묶어줍니다. 이를 통해 카페나 회사에서도 안전하게 우리 집 서버에 접속할 수 있습니다.


#### Step 1. 리눅스 서버에 Tailscale 설치

아래 명령어를 입력하면 인증 링크가 출력됩니다. 해당 링크로 접속하여 로그인하면 서버 등록이 완료됩니다.

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```


#### Step 2. 클라이언트(내 PC) 설정

접속하려는 외부 PC(Mac/Windows/Mobile)에도 Tailscale 앱을 설치하고 로그인합니다. 이제 내 PC와 서버는 `100.x.x.x` 대역의 사설 IP로 연결되었습니다.


#### Step 3. 접속 테스트

외부 PC (예: 노트북) 터미널에서 Tailscale IP를 통해 접속을 시도해 봅니다.

```sh
ssh -p 22 {사용자명}@{Tailscale_IP}
```

---

## 6 SSH 보안 강화

서버를 외부에 오픈할 때 기본 설정(Port 22, 비밀번호 로그인)을 그대로 두는 것은 보안상 매우 취약합니다. **'무차별 대입 공격(Brute Force) 방어'** 와 **'접근 제어'** 를 위해 아래 4가지 작업을 진행하는 것이 좋습니다.

1. **SSH 포트 변경:** 무차별 대입 공격 봇 회피
2. **SSH 키 인증 전환:** 비밀번호보다 강력한 암호화 키 방식 도입
3. **비밀번호 로그인 차단:** 무단 접속 시도 봉쇄
4. **Root 로그인 차단:** 시스템 관리자 권한 보호

---

### 6.1 SSH 포트 변경

기본 포트(22)는 공격 봇들의 주 타겟입니다. 포트 번호를 변경하는 것만으로도 무의미한 접속 시도 로그를 줄일 수 있습니다.


#### Step 1. 방화벽에서 새 포트 미리 허용

설정을 바꾸기 전에 방화벽을 먼저 열어둬야 접속이 끊기는 불상사를 막을 수 있습니다. (예: 2222번 포트 사용)

```sh
sudo ufw allow 2222/tcp
```


#### Step 2. SSH 설정 파일 수정

```sh
sudo nano /etc/ssh/sshd_config
```

파일 내에서 `Port 22` 부분을 찾아 주석(`#`)을 지우고 원하는 포트 번호로 변경합니다.

```sh
#Port 22

↓↓↓

Port 2222
```


#### Step 3. 서비스 재시작

```sh
sudo systemctl restart ssh
```


#### Step 4. 테스트

새 터미널 창을 열어 접속이 잘 되는지 확인합니다. (⚠️ 현재 터미널 창을 절대 먼저 닫지 마세요!)

```sh
ssh -p 2222 {사용자명}@{Tailscale_IP}
```


#### Step 5. 기존 포트 닫기

새로운 포트 번호로 접속이 잘 된다면 기존 22번 포트는 닫아줍니다.

```sh
sudo ufw delete allow OpenSSH
```

---

### 6.2 SSH 키 인증 전환

비밀번호 입력 방식은 언젠가 뚫릴 위험이 있습니다. SSH Key Pair 방식을 도입하여, '개인 키(Private Key)'를 가진 내 기기에서만 접속할 수 있도록 제한합니다.


#### Step 1. 키 생성 (내 PC에서 실행)

```sh
# 기본 경로(~/.ssh/id_ed25519)에 생성됩니다.

ssh-keygen -t ed25519 -C "homeserver”
```


#### Step 2. 서버에 공개키 전송 (내 PC에서 실행)

`ssh-copy-id` 명령어를 사용하면 공개키 전송과 권한 설정을 한 번에 처리할 수 있습니다.

```sh
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 {사용자명}@{Tailscale_IP}
```

---

### 6.3 비밀번호 & Root 로그인 차단

키 설정이 완료되었다면, 이제 보안의 구멍이 될 수 있는 '비밀번호 입력'과 'Root 계정 직접 접근'을 막아줍니다.


#### Step 1. SSH 설정 파일 수정

```sh
sudo nano /etc/ssh/sshd_config
```

`PasswordAuthentication`과 `PermitRootLogin` 항목을 찾아 주석(`#`)을 지우고 `no`로 변경합니다.

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

#### Step 2. Include 설정 확인

Ubuntu 최신 버전에서는 `/etc/ssh/sshd_config.d/` 디렉토리 내의 설정 파일이 우선순위를 가질 수가 있습니다. 아래 명령어로 덮어쓰는 설정이 있는지 확인하고, 있다면 해당 파일도 수정해 줍니다.

```sh
sudo grep -R "PasswordAuthentication" /etc/ssh/sshd_config.d/
sudo grep -R "PermitRootLogin" /etc/ssh/sshd_config.d/
```

#### Step 3. 서비스 재시작

```sh
sudo systemctl restart ssh
```
