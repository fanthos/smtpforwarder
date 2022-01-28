#!/bin/sh

pkgmgr=yarn
cd $(dirname $0)

$pkgmgr install
$pkgmgr run serve
