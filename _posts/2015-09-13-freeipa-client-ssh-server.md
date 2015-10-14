---
layout: post
title:  "A Dockerized Login Server for Docker Services"
date:   2015-09-13 02:30:00 EDT
categories: ["Docker", "MongoDB", "FreeIPA"]
---

I needed a way to [***securely***](http://www.information-age.com/technology/security/123459001/major-security-alert-40000-mongodb-databases-left-unsecured-internet) access my MongoDB instance running in one of my Docker containers from the stupendous wilds of the Internet. This had to overcome the fact that the server with the MongoDB instance is behind a firewall with NAT. <span class="more"></span>

Instead of a building a physical login server, I had the idea to create a virtual login server running inside a container on the same Docker host. Once in place, I would tell the firewall to forward all outside requests to port 22 ([or is it 2020?](http://security.stackexchange.com/questions/32308/should-i-change-the-default-ssh-port-on-linux-servers)) to the container. My goal was to make it as simple as possible given the complications. One of those was that I'm using [FreeIPA](http://www.freeipa.org/page/About) to manage my network's user accounts. All in all, I needed to create a container that

* has its own routable IP (different from the Docker host machine),
* is enrolled in my FreeIPA domain so that FreeIPA users can sign in,
* runs an SSH server (yes yes, I've read [this](https://jpetazzo.github.io/2014/06/23/docker-ssh-considered-evil/), it does not apply).

In order to get the routable IP, I had to mess with bridged networking. My dealings with NetworkManager were less than fortunate, and I decided to switch to systemd-networkd. Successfully. Read further if you want to reproduce my setup.

## The Docker image

I created a Docker image, `tscholak/freeipa-client-ssh-server`, that you can find on [Docker Hub](https://hub.docker.com/u/tscholak/). The sources are in a [repository on GitHub](https://github.com/tscholak/dockerfiles/tree/master/freeipa-client-ssh-server).

The image is based on the official [Fedora 22 image](https://hub.docker.com/_/fedora/) and also incorporates some pieces from [here](http://developerblog.redhat.com/2014/05/05/running-systemd-within-docker-container/), [there](https://vpavlin.eu/2015/02/fedora-docker-and-systemd/), and [elsewhere](https://github.com/fedora-cloud/Fedora-Dockerfiles/tree/master/systemd/systemd) to get systemd to run inside a Docker container.

You can either pull the image from Docker Hub,

```
＄ sudo docker pull tscholak/freeipa-client-ssh-server
```

or pull the sources from GitHub, make changes, and build it yourself:

```
＄ git clone https://github.com/tscholak/dockerfiles.git
＄ cd dockerfiles/freeipa-client-ssh-server
＄ sudo docker build --rm -t tscholak/freeipa-client-ssh-server .
```

Give the image a try and run a container called `fcss` from it by executing:

```
＄ sudo docker run -d --name=fcss \
  --privileged=false --cap-add SYS_TIME \
  --net=none --hostname=fcss.[YOUR IPA DOMAIN] \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  tscholak/freeipa-client-ssh-server
```

where `[YOUR IPA DOMAIN]` holds the place of your FreeIPA domain.

The root password is set randomly at runtime.

## Configuration

The container you just created has a serious flaw - it does not have any network connectivity! I couldn't get this image to work properly with Docker's standard bridged networking. That's why it is deactivated, `--net=none`. Instead, you will have to create the bridge manually. I explain here how this can be done quickly and straightforwardly with *systemd-networkd*, a daemon that manages network configurations and can replace NetworkManager in most cases. It is not a drop-in replacement, though. You need to reproduce your NetworkManager configuration with systemd-networkd. You also need to set up the bridge. Both is explained below. The guide is based on [this](https://major.io/2015/03/26/creating-a-bridge-for-virtual-machines-using-systemd-networkd/) article.

### Configure the physical network adapters

I assume you are on Fedora 22 with the NetworkManager service enabled (that would be the case for any standard installation). The primary network interface shall be named `em1` (typically, the name of a wired network interface in Linux is `eth0`, so replace `em1` where appropriate). Start by creating the `network` directory in `/etc/systemd`:

```
＄ sudo mkdir -p /etc/systemd/network
```

Then, create a bridge device called `br0`. It will replace Docker's `docker0` device. To this end, create a new file `/etc/systemd/network/br0.netdev` reading

```
[NetDev]
Name=br0
Kind=bridge
```

This tells systemd that the new device has the name `br0` and is an ethernet bridge. Proceed by creating the file `/etc/systemd/network/em1.network`. Into it, write the following:

```
[Match]
Name=em1

[Network]
Bridge=br0
```

That lets systemd attach the physical network interface `em1` to the bridge device `br0`. In a sense, `br0` will replace `em1`. Therefore, you will need to assign an IP to it. If your physical interface used to have the IP `10.0.0.2/24` with a default gateway at `10.0.0.1` and two DNS servers, e.g. at `10.0.0.2` and at `8.8.8.8`, then `br0` would need to be configured in the exact same way. Create the file `/etc/systemd/network/br0.network` and fill it with:

```
[Match]
Name=br0

[Network]
Address=10.0.0.2/24
Gateway=10.0.0.1
DNS=10.0.0.2
DNS=8.8.8.8
Domains=[YOUR IPA DOMAIN]
```

where `[YOUR IPA DOMAIN]` needs to be replaced by your FreeIPA domain name.

This is a very simple configuration that uses only the most basic configuration keys. Read [here](http://www.freedesktop.org/software/systemd/man/systemd.network.html) about additional configuration options. There is also [this](https://wiki.archlinux.org/index.php/Systemd-networkd) guide on the ArchWiki.

### Prepare the services

It is now time to turn off NetworkManager and turn on systemd-networkd.

**CAUTION! Make sure that you issue the following commands LOCALLY on the server or via iKVM over LAN!** Your machine will at least temporarily lose network connection and, if anything goes wrong, you won't be able to log in via SSH again.

The critical commands are:

```
＄ sudo systemctl disable network
＄ sudo systemctl disable NetworkManager
＄ sudo systemctl enable systemd-networkd
```

If there are no errors, the machine should be on-line again with network being managed by systemd-networkd.

One more thing: NetworkManager also manages `/etc/resolv.conf`. After disabling NetworkManager it is therefore unmanaged. Systemd brings its own caching resolver, though, systemd-resolved. To activate it, issue:

```
＄ sudo systemctl enable systemd-resolved
＄ sudo systemctl start systemd-resolved
＄ sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
```

To make use of the local DNS stub resolver of systemd-resolved, replace `dns` with `resolve` in `/etc/nsswitch.conf`:

```
hosts: files resolve myhostname mymachines
```

### Check the basic network configuration

Try running

```
＄ networkctl 
IDX LINK             TYPE               OPERATIONAL SETUP     
  1 lo               loopback           carrier     unmanaged 
  2 br0              ether              routable    configured
  3 em1              ether              degraded    configured
  4 em2              ether              off         unmanaged 
  5 docker0          ether              no-carrier  unmanaged 

5 links listed.
```

The Ethernet card in this server has two ports, and only `em1` is in use. In this exemplary output of `networkctl`, it has a degraded status because there is no IP address assigned to `em1`. This can be safely ignored.

The important thing to look for here is that `br0` is operational with status `routable`.

If there are any problems, try to reboot the server. If that doesn't help, check your configuration in `/etc/systemd/network/` again for mistakes.

### Switching from `docker0` to `br0`

You need to tell Docker to use the new bridge `br0` instead of the legacy interface `docker0`. For this, the docker daemon needs to be temporarily stopped (running containers will be stopped too!):

```
＄ sudo systemctl stop docker
```

Add the following to `/etc/sysconfig/docker-network`:

```
DOCKER_NETWORK_OPTIONS='-b=br0'
```

You can now delete the `docker0` bridge interface (this is optional):

```
＄ sudo ip link set dev docker0 down
＄ sudo brctl delbr docker0
```

Note that, if `brctl` cannot be found, install it with `sudo dnf install bridge-utils` (read [this](http://dnf.readthedocs.org/en/latest/cli_vs_yum.html) if you are unfamiliar with DNF). Next is NAT. I didn't need it, but [this article](https://www.ibm.com/developerworks/community/blogs/powermeup/entry/Setting_up_a_Docker_Bridge) recommends to issue to following `iptables` command:

```
＄ sudo iptables -t nat -F POSTROUTING
```

In any case, make sure that `iptables -t nat -L` lists following rule:

```
...
Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination         
...
MASQUERADE  all  --  10.0.0.0/24          anywhere
...
```

Once this checks out, you can restart the Docker service and the container:

```
＄ sudo systemctl start docker
＄ sudo docker start fcss
```

### Bringing up the network in the container

The container `fcss` still hasn't got any networking. You are almost there, though. First, create a new `veth` [virtual interface](http://superuser.com/questions/764986/howto-setup-a-veth-virtual-network):

```
＄ sudo ip link add veth0 type veth peer name fcss-veth0
```

Then, activate the newly created interface:

```
＄ sudo ip link set fcss-veth0 up
```

Now add the interface to the bridge `br0`:

```
＄ sudo brctl addif br0 fcss-veth0
```

For the next steps, you will need to know the PID of the container `fcss`. You can get it with:

```
＄ sudo docker inspect --format '\{\{.State.Pid\}\}' fcss
31058
```

In this example, the PID is `31058` (since yours will be most certainly different, don't forget to make the necessary changes below). Now, move the `veth0` interface into the container's name space:

```
＄ sudo ip link set netns 31058 dev veth0
```

Since `--privileged=false`, you cannot modify the network configuration of the container from within. Instead, you have to do this from the outside. This is where the `nsenter` tool comes in handy (part of the `util-linux` package). With the following commands, you should be able to activate `veth0`, set the IP address, and specify the default gateway:

```
＄ sudo nsenter -t 31058 --net ip link set veth0 up
＄ sudo nsenter -t 31058 --net ip addr add 10.0.0.101/24 dev veth0
＄ sudo nsenter -t 31058 --net ip route add default via 10.0.0.1 dev veth0
```

You should replace `10.0.0.101/24` and `10.0.0.1` with your values.

## Setting up the container as a FreeIPA client

Enter the docker container `fcss` with:

```
＄ sudo docker exec -t -i fcss /bin/bash
```

Check that you have network access:

```
# curl http://www.google.ca/index.html
```

Now, run the client setup command:

```
# ipa-client-install --unattended \
  --server="[YOUR IPA SERVER]" \
  --domain="[YOUR IPA REALM]" --principal="admin" \
  --password="[YOUR IPA ADMIN PASSWORD]" \
  --mkhomedir --force
```

where `[YOUR IPA REALM]`, `[YOUR IPA SERVER]` (e.g., `10.0.0.2`), and `[YOUR IPA ADMIN PASSWORD]` need to be replaced by your FreeIPA realm, the IP address of (one of) your FreeIPA directory server(s), and the password to your FreeIPA admin account, respectively.

That's it. You should now be able to ssh into the container from anywhere in your local network with:

```
＄ ssh [IPA USERNAME]@fcss.[YOUR IPA DOMAIN]
```

If it doesn't work, and if you see

```
System is booting up. See pam_nologin(8)
Connection closed by 10.0.0.101
```

instead, delete `/run/nologin` by running

```
＄ sudo docker exec -t -i fcss rm /run/nologin
```

## SSH port forwarding with three hosts

Below I describe quickly how you would use the login server. On the server with the MongoDB instance, run:

```
＄ ssh -f -o TCPKeepAlive=no -o ServerAliveInterval=15 -nNT -R 27017:localhost:27017 [IPA USERNAME]@fcss.[YOUR IPA DOMAIN]
```

This establishes a persistent SSH tunnel. You need to configure your router/firewall to forward incoming outside SSH requests to your WAN IP address (`[WAN IP ADDRESS]` below) to `fcss.[YOUR IPA DOMAIN]:22`. Once everything is in place, run on the remote client:

```
＄ ssh -f -o TCPKeepAlive=no -o ServerAliveInterval=15 -nNT -L 27017:localhost:27017 [IPA USERNAME]@$[WAN IP ADDRESS]
＄ mongo localhost:27017
MongoDB shell version: 3.0.6
connecting to: localhost:27017/[YOUR DB]
> exit
```

Fertig.
