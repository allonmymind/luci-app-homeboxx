include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Homebox
LUCI_DESCRIPTION:=Manage the Homebox LAN speed test service
LUCI_DEPENDS:=+homebox
LUCI_PKGARCH:=all

PKG_NAME:=luci-app-homebox
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/luci/luci.mk

# LuCI application package
