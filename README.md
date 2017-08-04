



                                               +-------------------+
                                               |                   |
                                               |  Weather Company  <-------------+
                                               |                   |             |
                                               +-------------------+             |
                                                                                 |
       1. Weather channel requests NYC Barometer data                            |
       2. Market contract responds with NYC barometer                            |
          contract address                            +--------+                 |
                                                 +----+ Market |                 |
                                                 |    +--------+                 |
                                                 |                               |
      3. The NYC      +--------------------------v-----------------------+       |
      barometer       |                  NYC Barometer                   |       |
      contract has a  |                     Contract                     |       |
      list of all the |                                                  |       |
      providers of NYC|   current                                        |       |
      barometer data. |  +--------+  +--------+  +--------+  ----------  |       |
                      |  |Provider|  |Provider|  |Provider|  |Provider|  |       |
                      |  |   1    |  |   2    |  |   3    |  |   4    |  |       |
                      |  +--------+  +--------+  +--------+  +--------+  |       |
    4. When the       |   rated +1    rated +1    rated -1    rated 0    |       |
    channel requests  |                                                  |       |
    a provier of the  +---------+----------------------------------------+       |
    data, it will               |                                                |
    respond with a public key   |                                                |
    and contract address of a   |                                                |
    provider contract.          |                                                |
                                |                                                |
                        +-------v----+  5. The weather company generates         |
                        |            |  a UUID, encrypts it with the             |
                        |  Provider  |  provider's public key, and sends         |
                        |  Contract  |  it along with some tokens and it's       |
                        |     1      |  own public key.                          |
                        |            |                                           |
                        +---+--------+                                           |
                            |                                                    |
               +--------+   |  6. The IoT device associated with                 |
               |        |   |  the provider contract receives an                 |
               |  IoT   |   |  event from the provider contract                  |
               | Device <---+  with the information sent from the                |
               |        |      weather company.                                  |
               +----+---+                                                        |
                    |      7. The IoT device decrypts the UUID,                  |
                    |      calculates based off of his current rate              |
                    |      how long he is going to send data from,               |
                    |      and subscribes to the channel named the               |
                    |      UUID he was sent, and begins sending                  +
                    |      the data encrypted with the weather
                    |      company public key.                         XXXXXXXXXXX
                    |                                          XXXXXXXXX          XXXXX
                    |                                      XXXX                       XX
                    |                                     X                            X
                    +-------------------------------->    X   XXXXX  XXXX   XXXX  XXXX X
                                                          X     X    X   X  X    X     XX
                                                          X     X    XXX    XXXX  XXX   XX
                                                          X     X    X      X        X   X
                                                           X  XXXXX  X      X    XXXX  XXX
                                                            XX                          X
                                                              XXX     X X XXXX XXXXXXXXXX
                                                                 XXXXX
