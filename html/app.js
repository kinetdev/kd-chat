"use strict"

$(function () {
    let channelData = {};

    let currentChannel = 'all';
    let suggestions = [];
    let chatHideTimeout = null;
    let historyMyChat = [];
    let historyIndex = -1;
    /* $.getJSON("suggest.json", function(data) {
        suggestions = data;
    }); */

    $('.container-setting').hide();
    $('.container-form-inputside-suggest').empty();
    $('.container-form-inputside-suggest').hide();
    $('.container-chat').empty();


    // test // 
    /* $('.container').hide(); */
    toggleui('chat', false);
    toggleui('input', false);

    window.addEventListener('message', function(event) {
        let data = event.data;

        switch (data.action) {
            case 'init':
                if (data.position == 'channel') {
                    channelData = data.data;
                    createChannel(channelData);
                } else if (data.position == 'suggest') {
                    suggestions = data.data;
                };
                
                break;
            case 'update':
                if (data.type == 'set_suggest') {
                    console.log('set command')
                    if (suggestions.length === 0) {
                        suggestions = data.suggestion;
                    } else {
                        data.suggestion.forEach(item => {
                            const index = suggestions.findIndex(item2 => item2.name === item.name);
                            if (index !== -1) {
                                suggestions[index] = item;
                            } else {
                                suggestions.push(item);
                            }
                        });
                    }
                    
                } else if (data.type == 'add_suggest') {
                    const suggestion = data.suggestion;
                    const duplicateSuggestion = suggestions.find(item => item.name === suggestion.name);
                
                    if (suggestion.name == '/additem') {
                        console.log(suggestion)
                    }
                    if (duplicateSuggestion) {
                        if (suggestion.help || suggestion.params) {
                            duplicateSuggestion.help = suggestion.help || "";
                            duplicateSuggestion.params = suggestion.params || [];
                        }
                        return;
                    }
                
                    if (!suggestion.params) {
                        suggestion.params = []; // TODO: Move somewhere else
                    }
                
                    suggestions.push(suggestion);
                } else if (data.type == 'remove_suggest') {
                    const index = suggestions.findIndex(item => item.name === data.name);
                    if (index !== -1) {
                        suggestions.splice(index, 1);
                    };
                }
                break;
            case 'toggle':
                if (data.status) {
                    toggleui('chat', true);
                    toggleui('input', true);
                };
                break;
            case 'client':
                reciverData(data.chatData);
                break;
            case 'disable':
                if (data.status) {
                    $('.container').fadeOut(0);
                } else {
                    $('.container').fadeIn(0);
                }
                break;
        };
    })

    function toggleui(ui, status, data) {
        switch (ui) {
            case 'chat':
                const chatOption = localStorage.getItem('chatOption');

                if (status) {
                    $('.container-channel').fadeIn(0);
                    $('.container-chat').fadeIn(0);

                } else {
                    if (chatOption !== '2') {
                        $('.container-channel').fadeOut(0);
                        $('.container-chat').fadeOut(0);
                    };
                };
                break;
            case 'input':
                if (status) {
                    $('.container-form').fadeIn(0);
                    $('.input-text').focus();
                } else {
                    $('.container-form').fadeOut(0);
                    $('emoji-picker').fadeOut(0);
                    $('.container-setting').hide();

                };
                break;
        };
    };

    $('.scroll-btn').click(function() {
        scrollChat()
    });
    
    $('.emoji-btn').click(function (e) {
        e.stopPropagation(); // Prevent event bubbling
        $('emoji-picker').toggle();
    });

    $('.delete-btn').click(function() {
        for (const [key, value] of Object.entries(channelData)) {
            channelData[key].messages = [];
        };

        loadIndexChat(currentChannel, false)
    });

    if (localStorage.getItem('chatOption') === null) {
        localStorage.setItem('chatOption', '0');
    };

    const selectedOption = localStorage.getItem('chatOption');
    $(`input[type=checkbox][data-option=${selectedOption}]`).prop('checked', true);

    $('input[type=checkbox]').on('change', function () {
        const selected = $(this).data('option');
        $('input[type=checkbox]').prop('checked', false);
        $(this).prop('checked', true);
        localStorage.setItem('chatOption', selected);
    });

    $('.setting-btn').click(function() {
        $('.container-setting').slideToggle();
    });

    $('emoji-picker')[0].addEventListener('emoji-click', function (event) {
        const emoji = event.detail.unicode;
        const currentVal = $('.container-form-inputside-input input').val();
        $('.container-form-inputside-input input').val(currentVal + emoji);
        $('.container-form-inputside-input input').focus(); // Maintain focus after emoji insertion
    });

    $('.container-form-inputside-input').click(function(e) {
        e.stopPropagation();
        $('.container-form-inputside-input input').focus();
    });

    $('.input-text').on('input', function () {
        const value = $(this).val().trimStart();
        const isCommand = value.startsWith('/');
        const words = value.split(/\s+/);
        const spaceCount = (value.match(/ /g) || []).length;
        const baseCommand = words[0];
    
        $('.container-form-inputside-suggest').empty().hide();
    
        if (isCommand) {
            const filtered = suggestions.filter(cmd => cmd.name.startsWith(baseCommand)).slice(0, 5);
    
            filtered.forEach(cmd => {
                const commandHighlight = baseCommand === cmd.name ? 'active' : '';
                let commandHTML = `<div class="command"><p class="${commandHighlight}">${cmd.name}</p>`;
    
                (cmd.params || []).forEach((param, index) => {
                    const isActive = index === spaceCount - 1;
                    commandHTML += `<p class="${isActive ? 'active' : ''}">[${param.name}]</p>`;
                });
    
                commandHTML += `</div>`;
    
                let desc = '';
                if (cmd.params && cmd.params[spaceCount - 1]) {
                    desc = cmd.params[spaceCount - 1].help || '';
                } else {
                    desc = cmd.help || '';
                }
    
                let descHTML = `<div class="description active">${desc}</div>`;
    
                $('.container-form-inputside-suggest').append(`
                    <div class="container-form-inputside-suggest-item">
                        ${commandHTML}
                        ${descHTML}
                    </div>
                `);
            });
    
            if (filtered.length > 0) {
                $('.container-form-inputside-suggest').fadeIn(0);
            }
        };
    });
    
    $('.container-form-inputside-send').click(function() {
        submitMessage();
    });

    $('.input-text').on('keydown', function(event) {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (historyMyChat.length > 0) {
                if (historyIndex === -1) {
                    historyIndex = historyMyChat.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                $(this).val(historyMyChat[historyIndex].text);
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (historyMyChat.length > 0) {
                if (historyIndex !== -1) {
                    if (historyIndex < historyMyChat.length - 1) {
                        historyIndex++;
                        $(this).val(historyMyChat[historyIndex].text);
                    } else {
                        historyIndex = -1;
                        $(this).val('');
                    }
                }
            }
        }
    });

    $(document).on('click', '.container-channel-sub', function () {
        let channelName = $(this).attr('channelName');
        if (currentChannel == channelName) return;
        $('.container-channel-sub').removeClass('selected');
        $(this).addClass('selected');
        selectChannel(channelName);
    });
    
    function selectChannel(name) {
        currentChannel = name;
        
        loadIndexChat(name, true);
    };

    function setSelectedChannelOnLoad() {
        $('.container-channel-sub').each(function () {
            let channelName = $(this).attr('channelName');
            if (channelName === currentChannel) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });

        $.post(`http://${GetParentResourceName()}/init`, JSON.stringify({}));

    };    
    
    function submitMessage() {
        let value = $('.input-text').val().trimStart();
        let isCommand = false;

        if (value !== '') {
            if (value[0] === '/') {
                isCommand = true
            };

            let data = {
                channel: currentChannel,
                text: value,
                isCommand: isCommand,
            }

            $.post(`http://${GetParentResourceName()}/sendmsg`, JSON.stringify(data));

            historyMyChat.push(data)
        };

        // reset 
        closeUi('1')
        const chatOption = localStorage.getItem('chatOption');

        if (chatOption === '1' || chatOption === '2') {
            toggleui('input', false);
        };
        $('.input-text').val('');
        setTimeout(() => {
            scrollChat();
        }, 100);
    };

    function reciverData(data) {
        addChatChannel(data);
    };

    /* setTimeout(() => {
        addNotify({
            tag: 'Cảnh Sát',
            color: 'red',
            text: 'test thong bao',
            action: 'notify_block'
        })
    }, 5000);
 */

    function addChatChannel(chatData) {
        if (!chatData.message) return;
        channelData[chatData.message.channel].messages.push(chatData);

        const containerFormCheck = document.querySelector('.container-form');
        const stillVisible = containerFormCheck && window.getComputedStyle(containerFormCheck).display !== 'none';
        let scroll = false
        if (!stillVisible) {
            scroll = true;
        }
        loadIndexChat(currentChannel, scroll);
    
        const chatOption = localStorage.getItem('chatOption');
    
        if (chatOption === '1') {
            toggleui('chat', true);
    
            if (chatHideTimeout !== null) {
                clearTimeout(chatHideTimeout);
            }
    
            const containerForm = document.querySelector('.container-form');
            const isContainerFormVisible = containerForm && window.getComputedStyle(containerForm).display !== 'none';
            
            if (!isContainerFormVisible) {
                chatHideTimeout = setTimeout(() => {
                    const containerFormCheck = document.querySelector('.container-form');
                    const stillVisible = containerFormCheck && window.getComputedStyle(containerFormCheck).display !== 'none';
            
                    if (!stillVisible) {
                        toggleui('chat', false);
                        chatHideTimeout = null;
                    } else {
                        chatHideTimeout = setTimeout(arguments.callee, 1000);
                    }
                }, 5000);
            }
        }
    };

    function loadIndexChat(name, down) {
        $('.container-chat').empty();
    
        let messages = [];
    
        if (name === 'all') {
            messages = Object.values(channelData)
                .flatMap(channel =>
                    channel.messages.map(msg => ({
                        ...msg,
                        label: channel.label,
                        channel: msg.message.channel
                    }))
                )
                .sort((a, b) => a.message.time - b.message.time);
        } else {
            const channel = channelData[name];
            if (!channel) return;
            messages = channel.messages.map(msg => ({
                ...msg,
                label: channel.label,
                channel: msg.message.channel
            }));
        }
    
        for (let data of messages) {
            if (data.action === 'normal') {
                const time = `<span class="time">${formatUnixTime(data.message.time)}</span>`;
                const group = (name === 'all' && data.channel === 'all') ? '' : `<span class="group">${data.label}</span>`;
                const vip = data.author.vip > 0 ? `<span class="vip">VIP ${data.author.vip}</span>` : '';
                const author = `<span class="author author-${data.author.color}">[${data.author.source}] ${data.author.tag} ${data.author.name}</span>`;
                const text = `<span class="single-msg">${data.message.text}</span>`;
        
                $('.container-chat').append(`
                    <div class="container-chat-item">
                        <p class="message-line">
                            ${time}${group}${vip}${author}${text}
                        </p>
                    </div>
                `);
            } else if (data.action === 'notify_block') {
                const formattedTime = formatUnixTime(data.message.time);
                $('.container-chat').append(`
                    <div class="container-chat-item">
                        <div class="message-block" style="border-left: 5px solid var(--msg-author-${data.author.color});">
                            <div class="message-block-info">
                                <div class="left">
                                    <i class="fi fi-rr-megaphone"></i>
                                    <p>${data.author.tag}</p>
                                </div>
                                <div class="right">
                                    ${formattedTime}
                                </div>
                            </div>
                            <div class="message-block-data">
                                <span>${data.message.text}</span>
                            </div>
                        </div>
                    </div>
                `);

            } else if (data.action === 'notify_system') {
                const formattedTime = formatUnixTime(data.message.time);

                if (data.message.channel == currentChannel) {
                    $('.container-chat').append(`
                        <div class="container-chat-item">
                            <p class="message-line">
                                <span class="time">${formattedTime}</span>
                                <span class="system author-${data.author.color}">${data.author.tag}</span> 
                                <span class="single-msg">${data.message.text}</span>
                            </p>
                        </div>
                    `);
                }
            };
        };        
    
        if (down) scrollChat();
    };

    $(document).on('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault(); // Ngăn chuyển focus mặc định
    
            let $channels = $('.container-channel-sub');
            let $current = $channels.filter('.selected');
            let currentIndex = $channels.index($current);
    
            let nextIndex = (currentIndex + 1) % $channels.length;
            let $next = $channels.eq(nextIndex);
    
            $channels.removeClass('selected');
            $next.addClass('selected');
    
            let channelName = $next.attr('channelName');
            selectChannel(channelName);
        }
    });
    
    function createChannel(data) {
        const sortedData = Object.entries(data).sort(function([keyA, valueA], [keyB, valueB]) { 
            return valueA.id - valueB.id || valueA.name.localeCompare(valueB.name);
        });

        $('.container-channel').empty();
        for (const [key, value] of sortedData) {
            $('.container-channel').append(
                `<div class="container-channel-sub" channelName="${key}">
                    <i class="${value.icon}"></i>
                    <p>${value.label}</p>
                </div>`
            );
        }

        setSelectedChannelOnLoad();
    };

    function scrollChat() {
        const chatContainer = document.querySelector('.container-chat');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    scrollChat();

    document.onkeyup = function (data) {
        if (data.which == 27) {
            $('.input-text').val('');
            submitMessage();

        } else if (data.which == 13) {
            submitMessage();
            closeUi('3')
        }
    };
    
    function closeUi(state) {
        const chatOption = localStorage.getItem('chatOption');
        if (chatOption === '0') {
            toggleui('chat', false);
            toggleui('input', false);
        }

        if (chatOption === '1') {
            if (chatHideTimeout !== null) {
                clearTimeout(chatHideTimeout);
            }
    
            const containerForm = document.querySelector('.container-form');
            const isContainerFormVisible = containerForm && window.getComputedStyle(containerForm).display !== 'none';
            
            if (!isContainerFormVisible) {
                chatHideTimeout = setTimeout(() => {
                    const containerFormCheck = document.querySelector('.container-form');
                    const inputTextCheck = document.querySelector('.input-text');
                    const stillVisible = containerFormCheck && window.getComputedStyle(containerFormCheck).display !== 'none';
                    const inputFocused = inputTextCheck && document.activeElement === inputTextCheck;
            
                    if (!stillVisible && !inputFocused) {
                        toggleui('chat', false);
                        chatHideTimeout = null;
                    } else {
                        chatHideTimeout = setTimeout(arguments.callee, 1000);
                    }
                }, 5000);
            }
            
        }

        $.post(`http://${GetParentResourceName()}/exit`, JSON.stringify({}));
    };
    
    $(document).click(function() {
        $('.container-form-inputside-input input').focus();
    });

    function formatUnixTime(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
    
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
    
        const day = date.getDate();
        const month = date.getMonth() + 1;
    
        return `${hours}:${minutes}:${seconds} ${day}/${month}`;
    };
    
});