---
--- Generated by EmmyLua(https://github.com/EmmyLua)
--- Created by Will.
--- DateTime: 12/17/2020 11:33 AM
---

local reactor = peripheral.wrap("back")
local modem = peripheral.wrap("top") -- This is the wireless modem for remote communications

local SERVER = 2 -- SET THIS VALUE TO THE ID OF THE REACTOR
local CLIENT = 1 -- SET THIS VALUE TO THE ID OF THE DISPLAY MACHINE

local ENERGY_MAX = 10000000
local FUEL_MAX = reactor.getFuelAmountMax()
local THRESHOLD = 60
local MINIMUM = 40

os.loadAPI("reactorSupportScripts/controlMain")

function main()
    local running = true
    reactor.setAllControlRodLevels(0)
    if reactor and reactor.getConnected() then
        while running do
            if not reactor.isActivelyCooled() then
                passiveController()
            else
                -- Program last
                activeController()
            end
        end
    else
        print("No valid reactor found!")
    end
end

function passiveController()
    local reactorData = table.pack(queryReactor())
    local controlRodData = table.pack(getControlRods())

    table.insert(reactorData, controlRodData)

    local autonomous = true
    if autonomous then
    -- Shutoff the reactor if the energy buffer raises above a set threshold
        if reactorData[3]*100 < THRESHOLD then
            if reactorData[3]*100 > MINIMUM then
                print("Buffer power below threshold.")
                reactor.setActive(true)
                local rodLevel = controlMain.pid(reactor)
                reactor.setAllControlRodLevels(rodLevel)
            else
                print("Buffer below minimum threshold")
                reactor.setActive(true)
                sleep(0.1)
            end
        else
            print("Buffer power above threshold.")
            reactor.setActive(false)
            sleep(0.1)
        end
    end

    if not autonomous then
        print("Welp ¯\\_(ツ)_/¯")
        print("If it isn't obvious I haven't implemented this yet so probably best you turn that back on.")
        sleep(0.1)
    end

    print("\n", table.unpack(reactorData))
    print(" ")
    sendDataToControlPanel(reactorData)
end

function queryReactor()
    local isActive = reactor.getActive()
    local energyStored = reactor.getEnergyStored()
    local energySaturation = energyStored/ENERGY_MAX
    local fuelLevel = reactor.getFuelAmount()
    local wasteLevel = reactor.getWasteAmount()
    local wasteProduced = reactor.getFuelConsumedLastTick()
    local rfProduced = reactor.getEnergyProducedLastTick()
    local reactivity = reactor.getFuelReactivity()
    local temp = reactor.getFuelTemperature()

    return isActive, energyStored, energySaturation, fuelLevel, wasteLevel, FUEL_MAX, reactivity, temp, wasteProduced, rfProduced
end

function getControlRods()
    local numberOfRodsInstalled = reactor.getNumberOfControlRods()-1
    local rodLevels = {}
    for i = 0, numberOfRodsInstalled do
        table.insert(rodLevels, reactor.getControlRodLevel(i))
    end

    return rodLevels
end
function sendDataToControlPanel(reactorData)
    rednet.open("bottom")
    rednet.send(CLIENT, reactorData)
    rednet.close("bottom")
end

main()