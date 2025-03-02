# test-automator


Task list:
- [ ] need to handle properly initializing text fields upon playback
- [ ] even if there is an error on stop-recording or stop-playback, stop it anyway and return 
- [ ] move all error checking to start of callback block
- [ ] do more error handling
- [ ] not handling back and forward browser buttons or refresh button
- [ ] review get functions and make sure we are only storing what we want to persist
- [ ] make sure values are contained to their recordingId
- [ ] need to reset storage or have each storage object be unique to each recordingId so there's no mixing of data between recordings 
- [ ] reset initialValues object for each new recording
- [ ] currently, hardcoding recordingId to always be 'test'. need to generate unique Id for each recording session. to do this will need to handle cases where the user legitimately stops and starts recording during the same recording OR the user stops the recording and wants to start a NEW recording
- [x] dispatch playback events from background instead of content-script
- [ ] stop playback when errors occur and the playback is invalid
- [ ] handle event 'misses' where, e.g., i click on something, but it doesn't click on the right thing during playback
- [ ] change the debugger message when the automator is running