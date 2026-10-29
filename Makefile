
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Homebox
LUCI_DESCRIPTION:=LuCI page for the Homebox LAN speed test service
LUCI_DEPENDS:=+homebox
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk
