# NOTE: THIS IS OUTDATED. IGNORE

                                                                    +-------------------+
                                                                    |                   |
                                                                    |  Weather Company  <-------------------------------------------------+
                                                                    |                   |                                                 |
                                                                    +-------+-^---------+                                                 |
    1. The weather company                                                  | |Send and receive information about                         |
    requests NYC barometer data                                             | |the providers and any data such as                         |
                                                                            | |merkle roots or ratings                                    |
    2. The market contract   +----------------------------------------------v-----------------------------------------------------+       |
    looks up a provider of   |                                                                                                    |       |
    NYC barometer data and   |                                       Synapse Market Contract                                      |       |
    returns a highly rated   |                                                                                                    |       |
    provider's public key    | +----------------------------------------------+  +----------------------------------------------+ |       |
                             | |                                              |  |                                              | |       |
    3. The weather company   | |                NYC Barometer                 |  |                Florida Frozen                | |       |
    can look at the ratings  | |                     Data                     |  |                Orange Futures                | |       |
    and decide whether or    | |                                              |  |                                              | |       |
    not to continue. If they | | +------------+ +------------+ +------------+ |  | +------------+ +------------+ +------------+ | |       |
    continue, they can send  | | |            | |            | |            | |  | |            | |            | |            | | |       |
    IQ to the synapse market | | |  Provider  | |  Provider  | |  Provider  | |  | |  Provider  | |  Provider  | |  Provider  | | |       |
    with a UUID encrypted    | | |            | |            | |            | |  | |            | |            | |            | | |       |
    with the provider's pub  | | |  rating +1 | |  rating -1 | |  rating 0  | |  | |  rating 0  | |  rating +2 | |  rating -1 | | |       |
    key and it's own public  | | | +--------+ | | +--------+ | | +--------+ | |  | | +--------+ | | +--------+ | | +--------+ | | |       |
    key.                     | | | |merkle 1| | | |merkle 1| | | |merkle 1| | |  | | |merkle 1| | | |merkle 1| | | |merkle 1| | | |       |
                             | | | |merkle 2| | | |merkle 2| | | |merkle 2| | |  | | |merkle 2| | | |merkle 2| | | |merkle 2| | | |       |
    4. Upon receiving this,  | | | |merkle 3| | | |merkle 3| | | |merkle 3| | |  | | |merkle 3| | | |merkle 3| | | |merkle 3| | | |       |
    the synapse market       | | | +-------^+ | | +--------+ | | +--------+ | |  | | +--------+ | | +--------+ | | +--------+ | | |       |
    contract can emit an     | | |         |  | |            | |            | |  | |            | |            | |            | | |       |
    e^ent with the relevant  | | +------+-----+ +------------+ +------------+ |  | +------------+ +------------+ +------------+ | |       |
    information to the IoT   | |        |  |                                  |  |                                              | |       |
    de^ice.                  | +----------------------------------------------+  +----------------------------------------------+ |       |
                             |          |  |                                                                                      |       |
    5. The IoT device can    +----------------------------------------------------------------------------------------------------+       |
    receive this information and decrypt|  |                                                                                              |
    the UUID, calculate the amount of   |  |Store merkle roots                                                                            |
    time it needs to emit data for based|  |                                                     XXXXXXXXXXX                              |
    off of it's own rates encrypted with|  |     Store merkle trees                      XXXXXXXXX          XXXXX                         |
    the public key of the wetaher       |  |     +------------------------------->   XXXX                       XX                        |
    company                             |  |     |                                  X                            X                        |
                                        |  +-----+--+                               X   XXXXX  XXXX   XXXX  XXXX X    The weather channel |
    6. As it does this, it constructs   |  |        |                               X     X    X   X  X    X     XX   subscribes to the   |
    a slide chain of the information    |  |  IoT   |Publish to the channel of UUID X     X    XXX    XXXX  XXX   XX  channel of UUID.    |
    and generates and emits a merkle    +--> Device +---------------------------->  X     X    X      X        X   X  +-------------------+
    tree to IPFS as it does this, storing  |        |                                X  XXXXX  X      X    XXXX  XXX
    the merkle root and IPFS address in    +--------+                                 XX                          X
    the synapse market contract.                                                        XXX     X X XXXX XXXXXXXXXX
                                                                                           XXXXX X XX   X
    7. Users of the weather service can verify that the weather information they receive
    hasn't been tampered with by requesting the provider's merkle root and IPFS address
    where they stored the merkle tree and verify the data.
