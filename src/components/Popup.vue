  <template>
    <div class="app">
        <h1>
            Welcome to bookmarks-from-json!
        </h1>
        <p class="hello">Add a url of a json and hit the "Add Json" button.

    <strong>Important notes:</strong>

    1- Be aware of CORS issues.
    2- You must serve your content via https.
        </p>
        <form>
            <el-input placeholder="Please input" v-model="urlInput">
            </el-input>
            <el-button type="primary" v-on:click="addUrl">Add Json</el-button>
        </form>
        <p class="error" v-if="inputError">
            {{inputError.message}}
        </p>
        <el-table
        :data="tableData"
        style="width: 700">
        <el-table-column
            prop="title"
            label="Title"
            width="180">
        </el-table-column>
        <el-table-column
            prop="status"
            label="Status"
            width="100">
            <template slot-scope="scope">
                <i class="el-icon-success green" v-if="tableData[scope.$index].status === 'success'"></i>
                <i class="el-icon-error red" v-if="tableData[scope.$index].status === 'failure'"></i>
            </template>
        </el-table-column>
        <el-table-column
            prop="url"
            label="Url">
            <template slot-scope="scope">
                <p class="url">
                    {{ tableData[scope.$index].url }}
                </p>
            </template>
        </el-table-column>
        <el-table-column label="Actions">
            <template slot-scope="scope">
                <div class="actions">
                    <el-button type="danger" icon="el-icon-delete" circle v-on:click="deleteUrl(scope.$index)"></el-button>
                </div>
            </template>
        </el-table-column>
    </el-table>
    </div>
  </template>

  <script>
    export default {
        methods: {
            addUrl() {
                const url = this.urlInput;
                if(!url.startsWith('https')) {
                    this.inputError = {
                      message: 'The url must start with "https"!'
                    };
                    return;
                } else {
                    this.inputError = null;
                }

                chrome.storage.sync.get('jsonUrls', async (result) => {
                    const data = result.jsonUrls || [];
                    data.push(url);

                    chrome.storage.sync.set({jsonUrls: data}, () => {
                        this.tableInit();
                    });

                    chrome.runtime.sendMessage({type: "syncJsonUrls"}, function(response) {
                        console.log(response);
                    });

                });
                this.urlInput = '';
            },
            tableInit() {
                chrome.storage.sync.get('jsonUrls', async (result) => {
                    const data = await Promise.all((result.jsonUrls || []).map(async (url) => {
                        return fetch(url, {cache: "no-store"}).then((r) => r.json()).then(data => ({
                            url,
                            status: 'success',
                            title: data[0].title,
                            data
                        })).catch((e) => {
                          console.error(e);
                          return {
                            url,
                            status: 'failure'
                          }
                        })
                    }));

                    console.log(data);
                    this.tableData = data;
                });
            },
            deleteUrl(index) {
                console.log('deleted index', index);
                const result = confirm(`Are you sure you want to delete '${this.tableData[index].title}'?`);
                if(!result) { return; }


                chrome.storage.sync.get('jsonUrls', async (result) => {
                    const jsonUrls = result.jsonUrls || [];
                    let newJsonUrls = [];
                    if(jsonUrls.length > 0) {
                        jsonUrls.splice(index, 1);
                        newJsonUrls = jsonUrls;
                    }

                    chrome.storage.sync.set({jsonUrls: newJsonUrls}, () => {
                        this.tableInit();
                    })
                });
            }
        },
          data() {
            return {
              urlInput: '',
              inputError: null,
              tableData: []
            }
          },
        created: function () {
            this.tableInit();
        }
    }
  </script>

  <style scope>
      .error {
          color: rgb(255, 0, 0);
          font-size: 16px;
          font-weight: 600;
      }

        .hello {
            font-size: 16px;
            margin-bottom: 25px;
            white-space: pre;
        }

      .actions {
          display: flex;
          align-items: center;;
          justify-content: center;
      }

      form {
          display: flex;
      }

      form button {
          margin-left: 5px !important;
      }
    .green {
        color: green;
        font-size: 25px;
    }

    .red {
        color: red;
        font-size: 25px;
    }

   .app {
       height: 400px;
       padding: 10px;
   }

  .url {
      text-overflow: inherit;
      white-space: nowrap;
  }
  </style>
  