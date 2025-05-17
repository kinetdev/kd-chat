cNui = class()

function cNui:init()
    self.isOpen = false
    self.forceClose = false
    self.suggest = {}

    Wait(2000)
    self:createData()
    self:NuiCallback()
end

function cNui:createData()
    self:updateData('channel', Config.Channel)
    self:updateData('suggest', {})
end

function cNui:updateData(position, data)

    SendNUIMessage({
        action = 'init',
        position = position,
        data = data
    })
end

function cNui:Toggle(status)
    self.isOpen = status
    SendNUIMessage({
        action = 'toggle',
        status = status
    })

    SetNuiFocus(status, status)
end

function cNui:DisableChat(status)
    SendNUIMessage({
        action = 'disable',
        status = status
    })
end

function cNui:NuiCallback()
    RegisterNuiCallback('exit', function(data, cb)
        self:Toggle(false)
    end)

    RegisterNuiCallback('init', function(data, cb)
        TriggerEvent('chat:init')
    end)

    RegisterNuiCallback('sendmsg', function(data, cb)
        if data.text:sub(1, 1) == '/' then
            ExecuteCommand(data.text:sub(2))
        else
            TriggerServerEvent('dz-chat:server:sendmsg', data)
        end
    end)

    CreateThread(function()
        while true do
            if not self.forceClose then
                if IsPauseMenuActive() then
                    self:DisableChat(true)
                else
                    self:DisableChat(false)
                end
            end
            Wait(500)
        end
    end)

    function forceClose(status)
        self.forceClose = status
        SendNUIMessage({
            action = 'disable',
            status = status
        })
    end

    exports('toggle', forceClose)
end