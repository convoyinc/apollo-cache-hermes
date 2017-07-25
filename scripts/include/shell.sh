#!/usr/bin/env bash

(( __SHELL_INCLUDED__ )) && return
__SHELL_INCLUDED__=1

export OPTIONS_FLAGS=()
export OPTIONS_ARGS=()
for argument in "${@}"; do
  if [[ "${argument}" =~ ^- ]]; then
    OPTIONS_FLAGS+=("${argument}")
  else
    OPTIONS_ARGS+=("${argument}")
  fi
done
