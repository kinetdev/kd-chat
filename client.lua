cMain = class()

RegisterNetEvent('chat:addSuggestion')
RegisterNetEvent('chat:addSuggestions')
RegisterNetEvent('chat:removeSuggestion')

function cMain:init()
    self.PlayerData = {}
    self.loaded = false
    self:EventHandlers()
    self:Command()
end

function cMain:EventHandlers()
    RegisterNetEvent('esx:playerLoaded', function()
        while ESX.GetPlayerData().job == nil do
            Wait(100)
        end
        self:RefreshCommand()
        self.PlayerData = ESX.GetPlayerData()
    end)
    
    RegisterNetEvent('esx:setJob', function(job)
        self.PlayerData.job = job
    end)
    
    RegisterNetEvent('esx:setJob2', function(job)
        self.PlayerData.job2 = job
    end)
    
    AddEventHandler('onResourceStart', function(name)
        if GetCurrentResourceName() == name then
            Wait(2000)
            self.PlayerData = ESX.GetPlayerData()
        end
    end)

    AddEventHandler('onClientResourceStart', function(resName)
        Wait(500)
        self:RefreshCommand()
    end)
      
    AddEventHandler('onClientResourceStop', function(resName)
        Wait(500)
        self:RefreshCommand()
    end)

    AddEventHandler('chat:addSuggestion', function(name, help, params)
        while not self.loaded do
            Wait(100)
        end

        SendNUIMessage({
            action = 'update',
            type = 'add_suggest',
            suggestion = {
                name = name,
                help = help,
                params = params or nil
            }
        })
    end)

    AddEventHandler('chat:addSuggestions', function(suggestions, side)
        --[[ SendNUIMessage({
            action = 'update',
            type = 'set_suggest',
            suggestion = suggestions
        }) ]]
        while not self.loaded do
            Wait(100)
        end
        for k, v in pairs(suggestions) do
            SendNUIMessage({
                action = 'update',
                type = 'add_suggest',
                suggestion = v
            })
        end

    end)

    AddEventHandler('chat:removeSuggestion', function(name)
        while not self.loaded do
            Wait(100)
        end
        SendNUIMessage({
            action = 'update',
            type = 'remove_suggest',
            name = name
        })
    end)

    RegisterNetEvent('chat:init', function()
        TriggerServerEvent('chat:init')
        self.loaded = true
    end)

    RegisterNetEvent('dz-chat:client:sendmsg', function(chatData)
        SendNUIMessage({
            action = 'client',
            chatData = chatData
        })
    end)
end

function cMain:Command()
    RegisterKeyMapping('chat', 'chat', 'KEYBOARD', 'T')
    RegisterCommand('chat', function(source)
        if IsPauseMenuActive() then return end
        if nui then
            nui:Toggle(true)
        end
    end)

end

function cMain:RefreshCommand()
    local registeredCommands = GetRegisteredCommands()
      
    local suggestions = {}

    for _, command in ipairs(registeredCommands) do
        if IsAceAllowed(('command.%s'):format(command.name)) then
            table.insert(suggestions, {
                name = '/' .. command.name,
                help = ''
            })
        end
    end

    TriggerEvent('chat:addSuggestions', suggestions, 'client')
end

main = cMain:new()
nui = cNui:new()