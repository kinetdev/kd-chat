sMain = class()

function sMain:init()
    self.PlayerTag = {}

    self:EventHandlers()
    self:Thread()
    self:Commands()
end

function sMain:EventHandlers()
    AddEventHandler('onServerResourceStart', function(resName)
        Wait(500)
    
        for _, player in ipairs(GetPlayers()) do
            self:RefreshCommand(player)
        end
    end)

    RegisterNetEvent('chat:init', function()
        self:RefreshCommand(source)
        self:sendNotify(-1, 'system', 'Nhật Ký', 'green', GetPlayerName(source)..' đã thức tỉnh', 'system')
    end)

    AddEventHandler('playerDropped', function(reason)
        self:sendNotify(-1, 'system', 'Nhật Ký', 'red', GetPlayerName(source)..' đã ra ngoài chạm cỏ ( '..reason..' )', 'system')
    end)

    RegisterNetEvent('dz-chat:server:sendmsg', function(data)
        local src = source
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            local channelData = Config.Channel[data.channel]

            if channelData.disablechat then return end
            if channelData.private then
                if not (self.PlayerTag[xPlayer.job2.name] and self.PlayerTag[xPlayer.job2.name][xPlayer.getIdentifier()]) then
        
                    return self:sendNotify(src, 'system', 'Hệ Thống', 'red', 'Bạn không có quyền hạn gửi tin nhắn ở đây', data.channel)
                end
            end

            if channelData.money then
                if xPlayer.getMoney() < channelData.money  then
        
                    return self:sendNotify(src, 'system', 'Hệ Thống', 'red', 'Cần 10k tiền khóa để chat ở kênh này', data.channel)
                end

                xPlayer.removeMoney(channelData.money, 'chat mua bán')
            end

            local dataTag = Config.NameTag[xPlayer.job2.name] or Config.NameTag[xPlayer.job.name] or Config.NameTag['default']
            local chatData = {
                action = 'normal',
                author = {
                    source = src,
                    name = GetPlayerName(src),
                    tag = dataTag.label,
                    color = dataTag.color,
                    vip = 0
                },
                message = {
                    text = data.text,
                    channel = data.channel,
                    time = os.time()
                },
            }

            if channelData.private then
                for k, v in pairs(self.PlayerTag[xPlayer.job2.name]) do
                    TriggerClientEvent('dz-chat:client:sendmsg', v, chatData)
                end
            else
                TriggerClientEvent('dz-chat:client:sendmsg', -1, chatData)
            end
        end
    end)
end

function sMain:Thread()
    CreateThread(function()
        while true do
            Wait(5000)
            local cache = {}

            for k, v in pairs(ESX.GetPlayers()) do
                local xPlayer = ESX.GetPlayerFromId(v)

                if xPlayer and xPlayer.job2 then
                    local name = xPlayer.job2.name

                    if Config.NameTag[name] then
                        if not cache[name] then
                            cache[name] = {}
                        end

                        cache[name][xPlayer.getIdentifier()] = xPlayer.source
                    end
                end
            end

            self.PlayerTag = cache
        end
    end)
end

function sMain:sendNotify(id, action, tag, color, text, channel)
    local picktype = {
        ['system'] = 'notify_system',
        ['block'] = 'notify_block',
    }
    local chatData = {
        action = picktype[action] or 'notify_system',
        author = {
            tag = tag,
            color = color,
        },
        message = {
            text = text,
            channel = channel,
            time = os.time()
        },
    }

    TriggerClientEvent('dz-chat:client:sendmsg', id, chatData)
end

function sMain:Commands()
    RegisterCommand('testnotify', function(source)
        if source == 0 then
            self:sendNotify(-1, 'block', 'Cảnh Sát', 'blue', 'xin chào đây là thông báo mẫu', 'all')
        end
    end)
end

function sMain:RefreshCommand(source)
    local registeredCommands = GetRegisteredCommands()

    local suggestions = {}

    for _, command in ipairs(registeredCommands) do
        if IsPlayerAceAllowed(source, ('command.%s'):format(command.name)) then
            table.insert(suggestions, {
                name = '/' .. command.name,
                help = ''
            })
        end
    end

    TriggerClientEvent('chat:addSuggestions', -1, suggestions, 'server')
end

sMain:init()