#!/bin/bash
cd ..

zip -r project.zip . -x "*node_modules*" -x "*dist*" -x "*build*" -x "*.env*"
